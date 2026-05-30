import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Building2,
  CalendarDays,
  Clock,
  ArrowRight,
  ExternalLink,
  Info,
  Languages,
  PenLine,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react"
import { Link } from "@tanstack/react-router"

import backendApiEndPoints from "@/api-fetch-endpoints/backendApiEndPoints.json"
import { EmptyState } from "@/components/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { WatchListButton } from "@/components/WatchListButton"
import { backendApiData } from "@/service/backendApiData"
import { fetchApiData } from "@/service/fetchApiData"

type EndpointConfig = {
  method: "GET"
  api: string
}

type MediaDetailPageProps = {
  id: string
  endpoint: EndpointConfig
  similarEndpoint: EndpointConfig
  recommendationsEndpoint: EndpointConfig
  seasonEndpoint?: EndpointConfig
  mediaLabel: string
  detailBasePath: "/movie" | "/series" | "/anime"
}

type TmdbGenre = {
  id: number
  name: string
}

type TmdbDetail = {
  id: number
  title?: string
  name?: string
  tagline?: string
  overview?: string
  genres?: TmdbGenre[]
  vote_average?: number
  release_date?: string
  first_air_date?: string
  last_air_date?: string
  in_production?: boolean
  runtime?: number
  episode_run_time?: number[]
  original_language?: string
  status?: string
  poster_path?: string | null
  backdrop_path?: string | null
  number_of_seasons?: number
  number_of_episodes?: number
  created_by?: TmdbCreator[]
  last_episode_to_air?: TmdbEpisodeSummary | null
  next_episode_to_air?: TmdbEpisodeSummary | null
  seasons?: TmdbSeason[]
  production_companies?: Array<{
    id: number
    name: string
    logo_path: string | null
    origin_country?: string
  }>
  credits?: {
    cast?: TmdbCredit[]
    crew?: TmdbCredit[]
  }
  reviews?: {
    results?: TmdbReview[]
  }
  "watch/providers"?: TmdbWatchProviders
}

type TmdbCredit = {
  id: number
  name: string
  character?: string
  job?: string
  department?: string
  profile_path: string | null
}

type TmdbCreator = {
  id: number
  name: string
  profile_path: string | null
}

type TmdbReview = {
  id: string
  author: string
  content: string
  created_at: string
  author_details?: {
    rating?: number | null
  }
}

type TmdbSeason = {
  id: number
  name: string
  overview?: string
  season_number: number
  episode_count: number
  air_date?: string | null
  poster_path: string | null
  vote_average?: number
}

type TmdbEpisodeSummary = {
  id: number
  name: string
  overview?: string
  episode_number: number
  season_number: number
  air_date?: string | null
  still_path?: string | null
  runtime?: number | null
  vote_average?: number
}

type TmdbRelatedItem = {
  id: number
  title?: string
  name?: string
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average?: number
  release_date?: string
  first_air_date?: string
}

type TmdbProvider = {
  display_priority?: number
  logo_path: string | null
  provider_id: number
  provider_name: string
}

type TmdbWatchRegion = {
  link?: string
  flatrate?: TmdbProvider[]
  rent?: TmdbProvider[]
  buy?: TmdbProvider[]
  ads?: TmdbProvider[]
  free?: TmdbProvider[]
}

type TmdbWatchProviders = {
  results?: Record<string, TmdbWatchRegion>
}

type TmdbListResponse<TItem> = {
  page?: number
  total_pages?: number
  results: TItem[]
}

type BackendApiEndPoints = {
  recent: {
    base: string
  }
}

type StoredUser = {
  _id?: string
  id?: string
}

const posterBaseUrl = "https://image.tmdb.org/t/p/w342"
const backdropBaseUrl = "https://image.tmdb.org/t/p/original"
const fallbackPoster =
  "https://placehold.co/342x513/111111/fafafa?text=No+Poster"
const fallbackLogo = "https://placehold.co/240x140/111111/fafafa?text=No+Logo"
const backendEndpoints = backendApiEndPoints as BackendApiEndPoints

function readStoredUser(): StoredUser | null {
  try {
    const storedUser = sessionStorage.getItem("user")
    return storedUser ? (JSON.parse(storedUser) as StoredUser) : null
  } catch {
    return null
  }
}

function getUserId() {
  const user = readStoredUser()
  return user?._id ?? user?.id
}

function getTitle(item: TmdbDetail) {
  return item.title ?? item.name ?? "Untitled"
}

function getRelatedTitle(item: TmdbRelatedItem) {
  return item.title ?? item.name ?? "Untitled"
}

function getReleaseYear(item: TmdbDetail) {
  const date = item.release_date ?? item.first_air_date

  if (!date) {
    return "TBA"
  }

  return new Date(date).getFullYear().toString()
}

function formatRating(rating?: number) {
  return rating && rating > 0 ? rating.toFixed(1) : "NR"
}

function formatRuntimeMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}hr : ${remainingMinutes} mins`
}

function getRuntime(item: TmdbDetail) {
  if (item.runtime) {
    return formatRuntimeMinutes(item.runtime)
  }

  const episodeRuntime = item.episode_run_time?.[0]

  if (episodeRuntime) {
    return `${formatRuntimeMinutes(episodeRuntime)} episodes`
  }

  return "Runtime TBA"
}

function getEpisodeCode(episode?: TmdbEpisodeSummary | null) {
  if (!episode) {
    return "TBA"
  }

  return `S${episode.season_number} E${episode.episode_number}`
}

function getProfileUrl(path: string | null) {
  return path
    ? `https://image.tmdb.org/t/p/w185${path}`
    : "https://placehold.co/185x278/111111/fafafa?text=No+Image"
}

function getPosterUrl(path: string | null) {
  return path ? `${posterBaseUrl}${path}` : fallbackPoster
}

function getBackdropUrl(path?: string | null) {
  return path ? `${backdropBaseUrl}${path}` : undefined
}

function getLogoUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w300${path}` : fallbackLogo
}

function getProviderLogoUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : fallbackLogo
}

function resolveTemplatedEndpoint(endpoint: string, id: string) {
  return endpoint.replace("{movie_id}", id).replace("{series_id}", id)
}

function mergeRelatedItems(
  currentItems: TmdbRelatedItem[],
  nextItems: TmdbRelatedItem[]
) {
  const seenIds = new Set(currentItems.map((item) => item.id))
  const uniqueNextItems = nextItems.filter((item) => {
    if (seenIds.has(item.id)) {
      return false
    }

    seenIds.add(item.id)
    return true
  })

  return [...currentItems, ...uniqueNextItems]
}

function formatReviewDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Recent"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatAirDate(value?: string | null) {
  if (!value) {
    return "Air date TBA"
  }

  return formatReviewDate(value)
}

function sortProviders(providers: TmdbProvider[] = []) {
  return [...providers].sort(
    (firstProvider, secondProvider) =>
      (firstProvider.display_priority ?? 999) -
      (secondProvider.display_priority ?? 999)
  )
}

function getProviderGroups(region: TmdbWatchRegion) {
  return [
    { label: "Stream", providers: sortProviders(region.flatrate) },
    { label: "Rent", providers: sortProviders(region.rent) },
    { label: "Buy", providers: sortProviders(region.buy) },
    { label: "Ads", providers: sortProviders(region.ads) },
    { label: "Free", providers: sortProviders(region.free) },
  ].filter((group) => group.providers.length > 0)
}

function getWatchRegions(detail: TmdbDetail) {
  const regions = Object.entries(detail["watch/providers"]?.results ?? {})

  return regions.sort(([firstRegionCode], [secondRegionCode]) => {
    const priorityRegions = ["IN", "US", "GB", "CA", "AU"]
    const firstPriority = priorityRegions.indexOf(firstRegionCode)
    const secondPriority = priorityRegions.indexOf(secondRegionCode)

    if (firstPriority >= 0 || secondPriority >= 0) {
      return (
        (firstPriority >= 0 ? firstPriority : 999) -
        (secondPriority >= 0 ? secondPriority : 999)
      )
    }

    return firstRegionCode.localeCompare(secondRegionCode)
  })
}

function DetailSkeleton() {
  return (
    <section className="grid gap-4 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="rounded-lg">
        <CardHeader>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      <Card className="rounded-lg">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-2/3" />
        </CardContent>
      </Card>
    </section>
  )
}

export function MediaDetailPage({
  id,
  endpoint,
  similarEndpoint,
  recommendationsEndpoint,
  seasonEndpoint,
  mediaLabel,
  detailBasePath,
}: MediaDetailPageProps) {
  const [detail, setDetail] = useState<TmdbDetail | null>(null)
  const [similarItems, setSimilarItems] = useState<TmdbRelatedItem[]>([])
  const [recommendedItems, setRecommendedItems] = useState<TmdbRelatedItem[]>(
    []
  )
  const [similarPage, setSimilarPage] = useState(0)
  const [recommendedPage, setRecommendedPage] = useState(0)
  const [similarHasMore, setSimilarHasMore] = useState(true)
  const [recommendedHasMore, setRecommendedHasMore] = useState(true)
  const [similarLoadingMore, setSimilarLoadingMore] = useState(false)
  const [recommendedLoadingMore, setRecommendedLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const detailEndpoint = useMemo(
    () => resolveTemplatedEndpoint(endpoint.api, id),
    [endpoint.api, id]
  )
  const similarResolvedEndpoint = useMemo(
    () => resolveTemplatedEndpoint(similarEndpoint.api, id),
    [id, similarEndpoint.api]
  )
  const recommendationsResolvedEndpoint = useMemo(
    () => resolveTemplatedEndpoint(recommendationsEndpoint.api, id),
    [id, recommendationsEndpoint.api]
  )

  const loadRelatedPage = useCallback(
    async (
      kind: "similar" | "recommended",
      page: number,
      mode: "replace" | "append",
      signal?: AbortSignal
    ) => {
      const isSimilar = kind === "similar"
      const endpointConfig = isSimilar
        ? similarEndpoint
        : recommendationsEndpoint
      const endpointUrl = isSimilar
        ? similarResolvedEndpoint
        : recommendationsResolvedEndpoint

      if (mode === "append") {
        if (isSimilar) {
          setSimilarLoadingMore(true)
        } else {
          setRecommendedLoadingMore(true)
        }
      }

      const response = await fetchApiData<TmdbListResponse<TmdbRelatedItem>>({
        endpoint: endpointUrl,
        method: endpointConfig.method,
        params: {
          language: "en-US",
          page,
        },
        signal,
      })

      if (signal?.aborted) {
        return
      }

      const nextItems = response?.results ?? []
      const nextPage = response?.page ?? page
      const totalPages = Math.min(response?.total_pages ?? page, 500)
      const hasMore = nextPage < totalPages

      if (isSimilar) {
        setSimilarItems((currentItems) =>
          mode === "append"
            ? mergeRelatedItems(currentItems, nextItems)
            : nextItems
        )
        setSimilarPage(nextPage)
        setSimilarHasMore(hasMore)
        setSimilarLoadingMore(false)
        return
      }

      setRecommendedItems((currentItems) =>
        mode === "append"
          ? mergeRelatedItems(currentItems, nextItems)
          : nextItems
      )
      setRecommendedPage(nextPage)
      setRecommendedHasMore(hasMore)
      setRecommendedLoadingMore(false)
    },
    [
      recommendationsEndpoint,
      recommendationsResolvedEndpoint,
      similarEndpoint,
      similarResolvedEndpoint,
    ]
  )

  useEffect(() => {
    const abortController = new AbortController()

    async function loadDetail() {
      setLoading(true)
      setError(false)
      setSimilarItems([])
      setRecommendedItems([])
      setSimilarPage(0)
      setRecommendedPage(0)
      setSimilarHasMore(true)
      setRecommendedHasMore(true)
      setSimilarLoadingMore(false)
      setRecommendedLoadingMore(false)

      const [response, similarResponse, recommendationsResponse] =
        await Promise.all([
          fetchApiData<TmdbDetail>({
            endpoint: detailEndpoint,
            method: endpoint.method,
            params: {
              language: "en-US",
              append_to_response:
                "videos,credits,images,watch/providers,reviews",
            },
            signal: abortController.signal,
          }),
          fetchApiData<TmdbListResponse<TmdbRelatedItem>>({
            endpoint: similarResolvedEndpoint,
            method: similarEndpoint.method,
            params: {
              language: "en-US",
              page: 1,
            },
            signal: abortController.signal,
          }),
          fetchApiData<TmdbListResponse<TmdbRelatedItem>>({
            endpoint: recommendationsResolvedEndpoint,
            method: recommendationsEndpoint.method,
            params: {
              language: "en-US",
              page: 1,
            },
            signal: abortController.signal,
          }),
        ])

      if (abortController.signal.aborted) {
        return
      }

      setDetail(response)
      const similarPageNumber = similarResponse?.page ?? 1
      const recommendedPageNumber = recommendationsResponse?.page ?? 1
      const similarTotalPages = Math.min(similarResponse?.total_pages ?? 1, 500)
      const recommendedTotalPages = Math.min(
        recommendationsResponse?.total_pages ?? 1,
        500
      )

      setSimilarItems(similarResponse?.results ?? [])
      setRecommendedItems(recommendationsResponse?.results ?? [])
      setSimilarPage(similarPageNumber)
      setRecommendedPage(recommendedPageNumber)
      setSimilarHasMore(similarPageNumber < similarTotalPages)
      setRecommendedHasMore(recommendedPageNumber < recommendedTotalPages)
      setError(!response)
      setLoading(false)
    }

    void loadDetail()

    return () => abortController.abort()
  }, [
    detailEndpoint,
    endpoint.method,
    id,
    recommendationsEndpoint.method,
    recommendationsResolvedEndpoint,
    similarEndpoint.method,
    similarResolvedEndpoint,
  ])

  useEffect(() => {
    const userId = getUserId()

    if (!userId || !detail) {
      return
    }

    void backendApiData({
      method: "POST",
      url: backendEndpoints.recent.base,
      payload: {
        user_id: userId,
        media_id: String(detail.id),
        media_type:
          detailBasePath === "/anime"
            ? "anime"
            : detailBasePath === "/series"
              ? "tv"
              : "movie",
        title: getTitle(detail),
        overview: detail.overview,
        poster_url: getPosterUrl(detail.poster_path ?? null),
        background_image_url: getBackdropUrl(detail.backdrop_path),
        source: "tmdb",
        metadata: {
          rating: detail.vote_average,
          release_year: getReleaseYear(detail),
          status: detail.status,
          genres: detail.genres?.map((genre) => genre.name) ?? [],
        },
        is_active: true,
      },
    })
  }, [detail, detailBasePath])

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !detail) {
    return (
      <EmptyState
        className="my-6"
        title="No data is available"
        description="We could not load the details for this title from TMDB right now."
      />
    )
  }

  const cast = detail.credits?.cast ?? []
  const crew = detail.credits?.crew ?? []
  const creators = detail.created_by ?? []
  const productionCompanies = detail.production_companies ?? []
  const watchRegions = getWatchRegions(detail)
  const seasonSummaries =
    detail.seasons
      ?.filter((season) => season.season_number > 0 && season.episode_count > 0)
      .sort(
        (firstSeason, secondSeason) =>
          firstSeason.season_number - secondSeason.season_number
      ) ?? []
  const reviews = detail.reviews?.results?.slice(0, 4) ?? []
  const loadNextRecommended = () => {
    if (recommendedLoadingMore || !recommendedHasMore) {
      return
    }

    void loadRelatedPage("recommended", recommendedPage + 1, "append")
  }
  const loadNextSimilar = () => {
    if (similarLoadingMore || !similarHasMore) {
      return
    }

    void loadRelatedPage("similar", similarPage + 1, "append")
  }

  return (
    <section className="space-y-6 py-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-md">
                {mediaLabel}
              </Badge>
              {detail.status && (
                <Badge variant="outline" className="rounded-md">
                  {detail.status}
                </Badge>
              )}
            </div>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-2xl sm:text-3xl">
                {getTitle(detail)}
              </CardTitle>
              <WatchListButton
                className="shrink-0 border-border bg-background text-foreground hover:bg-muted"
                item={{
                  media_id: detail.id,
                  media_type:
                    detailBasePath === "/anime"
                      ? "anime"
                      : detailBasePath === "/series"
                        ? "tv"
                        : "movie",
                  title: getTitle(detail),
                  overview: detail.overview,
                  poster_url: getPosterUrl(detail.poster_path ?? null),
                  background_image_url: getBackdropUrl(detail.backdrop_path),
                  metadata: {
                    rating: detail.vote_average,
                    release_year: getReleaseYear(detail),
                    status: detail.status,
                    genres: detail.genres?.map((genre) => genre.name) ?? [],
                  },
                }}
              />
            </div>
            {detail.tagline && (
              <CardDescription className="text-base">
                {detail.tagline}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">
              {detail.overview || "No overview available yet."}
            </p>
            {detail.genres && detail.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detail.genres.map((genre) => (
                  <Badge
                    key={genre.id}
                    variant="secondary"
                    className="rounded-md"
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Core title information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4" />
                Rating
              </span>
              <span className="font-medium">
                {formatRating(detail.vote_average)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Year
              </span>
              <span className="font-medium">{getReleaseYear(detail)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Runtime
              </span>
              <span className="font-medium">{getRuntime(detail)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Languages className="h-4 w-4" />
                Language
              </span>
              <span className="font-medium uppercase">
                {detail.original_language ?? "TBA"}
              </span>
            </div>
            {detail.status && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary" className="rounded-md">
                  {detail.status}
                </Badge>
              </div>
            )}
            {detail.number_of_seasons && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Seasons</span>
                <span className="font-medium">{detail.number_of_seasons}</span>
              </div>
            )}
            {detail.number_of_episodes && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Episodes</span>
                <span className="font-medium">{detail.number_of_episodes}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WatchProvidersSection regions={watchRegions} />

      {seasonEndpoint && (
        <EpisodesSection
          seasonSummaries={seasonSummaries}
          status={detail.status}
          firstAirDate={detail.first_air_date}
          lastAirDate={detail.last_air_date}
          inProduction={detail.in_production}
          totalEpisodes={detail.number_of_episodes}
          lastEpisode={detail.last_episode_to_air}
          nextEpisode={detail.next_episode_to_air}
          mediaId={id}
          detailBasePath={detailBasePath}
          isLoading={loading}
        />
      )}

      {creators.length > 0 && (
        <CreatorsSection creators={creators} mediaLabel={mediaLabel} />
      )}

      <CreditCarouselSection
        title="Cast"
        description="Featured performers from this title"
        icon={<UsersRound className="h-5 w-5" />}
        people={cast}
        roleFallback="Cast"
        getRole={(person) => person.character}
      />

      <RelatedMediaSection
        title="Recommended"
        description="More titles suggested from this record"
        items={recommendedItems}
        detailBasePath={detailBasePath}
        mediaLabel={mediaLabel}
        hasMore={recommendedHasMore}
        isLoadingMore={recommendedLoadingMore}
        onLoadMore={loadNextRecommended}
      />

      <RelatedMediaSection
        title="Similar"
        description="Titles with nearby themes and audience signals"
        items={similarItems}
        detailBasePath={detailBasePath}
        mediaLabel={mediaLabel}
        hasMore={similarHasMore}
        isLoadingMore={similarLoadingMore}
        onLoadMore={loadNextSimilar}
      />

      <CreditCarouselSection
        title="Crew"
        description="Creative and production team members"
        icon={<UserRound className="h-5 w-5" />}
        people={crew}
        roleFallback="Crew"
        getRole={(person) => person.job || person.department}
      />

      <ProductionCompaniesSection companies={productionCompanies} />

      <div className="grid gap-4">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>Audience and critic impressions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article key={review.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{review.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatReviewDate(review.created_at)}
                      </p>
                    </div>
                    {review.author_details?.rating && (
                      <Badge variant="secondary" className="rounded-md">
                        {review.author_details.rating}/10
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">
                    {review.content}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState
                compact
                title="No data is available"
                description="Reviews are not available yet."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function CreditCarouselSection({
  title,
  description,
  icon,
  people,
  roleFallback,
  getRole,
}: {
  title: string
  description: string
  icon: ReactNode
  people: TmdbCredit[]
  roleFallback: string
  getRole: (person: TmdbCredit) => string | undefined
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {people.length > 0 ? (
          <Carousel
            opts={{ align: "start", dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {people.map((person, index) => (
                <CarouselItem
                  key={`${person.id}-${getRole(person) ?? roleFallback}-${index}`}
                  className="basis-auto pl-3"
                >
                  <Link
                    to="/person/$personId"
                    params={{ personId: String(person.id) }}
                    className="group block"
                  >
                    <div className="h-[16.5rem] w-[8.25rem] overflow-hidden rounded-lg border bg-card transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg sm:h-[17.5rem] sm:w-[9rem]">
                      <img
                        src={getProfileUrl(person.profile_path)}
                        alt={person.name}
                        className="h-[12.25rem] w-full object-cover sm:h-[13rem]"
                        loading="lazy"
                      />
                      <div className="space-y-1 p-2.5">
                        <p className="line-clamp-1 text-xs font-medium sm:text-sm">
                          {person.name}
                        </p>
                        <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">
                          {getRole(person) || roleFallback}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-3 flex justify-end gap-2">
              <CarouselPrevious className="static translate-0 rounded-md" />
              <CarouselNext className="static translate-0 rounded-md" />
            </div>
          </Carousel>
        ) : (
          <EmptyState
            compact
            title="No data is available"
            description={`${title} details are not available yet.`}
          />
        )}
      </CardContent>
    </Card>
  )
}

function WatchProvidersSection({
  regions,
}: {
  regions: Array<[string, TmdbWatchRegion]>
}) {
  const totalProviders = regions.reduce((total, [, region]) => {
    return (
      total +
      getProviderGroups(region).reduce(
        (groupTotal, group) => groupTotal + group.providers.length,
        0
      )
    )
  }, 0)

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Watch Providers</CardTitle>
            <CardDescription>
              Streaming, rental, purchase, ads, and free availability by region.
            </CardDescription>
          </div>
          {regions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-md">
                {regions.length} regions
              </Badge>
              <Badge variant="outline" className="rounded-md">
                {totalProviders} providers
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {regions.length > 0 ? (
          <Carousel
            opts={{ align: "start", dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {regions.map(([regionCode, region]) => {
                const groups = getProviderGroups(region)

                return (
                  <CarouselItem key={regionCode} className="basis-auto pl-3">
                    <article className="flex h-[20rem] w-[40rem] max-w-full flex-col overflow-hidden rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-2 border-b bg-muted/30 p-3">
                        <div>
                          <Badge variant="secondary" className="rounded-md">
                            {regionCode}
                          </Badge>
                          <h3 className="mt-1.5 text-sm font-semibold">
                            {regionCode} Availability
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            {groups.length} available option groups
                          </p>
                        </div>
                        {region.link && (
                          <a
                            href={region.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:text-foreground"
                            aria-label={`Open ${regionCode} watch providers`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                        {groups.map((group) => (
                          <div key={group.label} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                {group.label}
                              </p>
                              <Badge variant="outline" className="rounded-md">
                                {group.providers.length}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                              {group.providers.map((provider) => (
                                <div
                                  key={`${group.label}-${provider.provider_id}`}
                                  className="flex min-w-0 items-center gap-1.5 rounded-md border bg-background/70 p-1.5"
                                >
                                  <img
                                    src={getProviderLogoUrl(provider.logo_path)}
                                    alt={provider.provider_name}
                                    className="h-6 w-6 shrink-0 rounded object-cover"
                                    loading="lazy"
                                  />
                                  <p className="line-clamp-2 text-left text-[10px] leading-3.5 font-medium">
                                    {provider.provider_name}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <div className="mt-3 flex justify-end gap-2">
              <CarouselPrevious className="static translate-0 rounded-md" />
              <CarouselNext className="static translate-0 rounded-md" />
            </div>
          </Carousel>
        ) : (
          <EmptyState
            compact
            title="No data is available"
            description="Watch provider details are not available yet for this title."
          />
        )}
      </CardContent>
    </Card>
  )
}

function CreatorsSection({
  creators,
  mediaLabel,
}: {
  creators: TmdbCreator[]
  mediaLabel: string
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <PenLine className="h-5 w-5" />
          Created By
        </CardTitle>
        <CardDescription>
          Original creators attached to this {mediaLabel.toLowerCase()}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
          <CarouselContent className="-ml-3">
            {creators.map((creator) => (
              <CarouselItem key={creator.id} className="basis-auto pl-3">
                <Link
                  to="/person/$personId"
                  params={{ personId: String(creator.id) }}
                  className="group flex h-32 w-64 items-center gap-3 rounded-lg border bg-card p-3 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <img
                    src={getProfileUrl(creator.profile_path)}
                    alt={creator.name}
                    className="h-24 w-16 rounded-md object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 space-y-2">
                    <Badge variant="secondary" className="rounded-md">
                      Creator
                    </Badge>
                    <p className="line-clamp-2 text-sm font-semibold">
                      {creator.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mediaLabel} creative lead
                    </p>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-3 flex justify-end gap-2">
            <CarouselPrevious className="static translate-0 rounded-md" />
            <CarouselNext className="static translate-0 rounded-md" />
          </div>
        </Carousel>
      </CardContent>
    </Card>
  )
}

function SeasonDataCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 line-clamp-1 text-sm font-semibold">{value}</p>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {detail}
      </p>
    </div>
  )
}

function EpisodesSection({
  seasonSummaries,
  status,
  firstAirDate,
  lastAirDate,
  inProduction,
  totalEpisodes,
  lastEpisode,
  nextEpisode,
  mediaId,
  detailBasePath,
  isLoading,
}: {
  seasonSummaries: TmdbSeason[]
  status?: string
  firstAirDate?: string
  lastAirDate?: string
  inProduction?: boolean
  totalEpisodes?: number
  lastEpisode?: TmdbEpisodeSummary | null
  nextEpisode?: TmdbEpisodeSummary | null
  mediaId: string
  detailBasePath: "/movie" | "/series" | "/anime"
  isLoading: boolean
}) {
  const seasonRoute =
    detailBasePath === "/anime"
      ? "/anime/$mediaId/season/$seasonNumber"
      : "/series/$mediaId/season/$seasonNumber"

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Seasons</CardTitle>
            <CardDescription>
              Season posters, dates, ratings, and episode counts from this
              series
            </CardDescription>
          </div>
          {status ? (
            <Badge variant="secondary" className="rounded-md">
              {status}
            </Badge>
          ) : isLoading ? (
            <Badge variant="secondary" className="rounded-md">
              Loading seasons
            </Badge>
          ) : null}
          {detailBasePath !== "/movie" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="sm" variant="outline" className="rounded-md">
                    <Link
                      to={
                        detailBasePath === "/anime"
                          ? "/anime/$mediaId/overview"
                          : "/series/$mediaId/overview"
                      }
                      params={{ mediaId }}
                    >
                      <Info className="h-4 w-4" />
                      View overview
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="max-w-64">
                  Open the overview page for season artwork, episode details,
                  air dates, and rating trends.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SeasonDataCard
            label="Airing window"
            value={`${formatAirDate(firstAirDate)} - ${formatAirDate(lastAirDate)}`}
            detail={
              inProduction ? "Currently in production" : "Production inactive"
            }
          />
          <SeasonDataCard
            label="Episode total"
            value={`${totalEpisodes ?? 0} episodes`}
            detail={`${seasonSummaries.length} seasons listed`}
          />
          <SeasonDataCard
            label="Last episode"
            value={getEpisodeCode(lastEpisode)}
            detail={lastEpisode?.name ?? "No last episode data"}
          />
          <SeasonDataCard
            label="Next episode"
            value={getEpisodeCode(nextEpisode)}
            detail={nextEpisode?.name ?? "No upcoming episode scheduled"}
          />
        </div>

        {seasonSummaries.length > 0 ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">Seasons</h3>
              <p className="text-xs text-muted-foreground">
                Browse season posters, dates, ratings, and episode counts.
              </p>
            </div>
            <Carousel
              opts={{ align: "start", dragFree: true }}
              className="w-full"
            >
              <CarouselContent className="-ml-3">
                {seasonSummaries.map((season) => (
                  <CarouselItem key={season.id} className="basis-auto pl-3">
                    <Link
                      to={seasonRoute}
                      params={{
                        mediaId,
                        seasonNumber: String(season.season_number),
                      }}
                      className="group flex h-44 w-[20rem] overflow-hidden rounded-lg border bg-card text-card-foreground transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:w-[24rem]"
                    >
                      <img
                        src={getPosterUrl(season.poster_path)}
                        alt={season.name}
                        className="h-full w-28 object-cover transition duration-300 group-hover:brightness-105 sm:w-32"
                        loading="lazy"
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-sm font-semibold">
                                {season.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatAirDate(season.air_date)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="shrink-0 rounded-md"
                            >
                              S{season.season_number}
                            </Badge>
                          </div>
                          <Badge
                            variant="secondary"
                            className="w-fit rounded-md px-1.5 py-0 text-[0.68rem]"
                          >
                            ID {season.id}
                          </Badge>
                          <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
                            {season.overview ||
                              "Season overview is not available yet."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="rounded-md">
                            {season.episode_count} episodes
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="gap-1 rounded-md"
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {formatRating(season.vote_average)}
                          </Badge>
                          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                            Details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-3 flex justify-end gap-2">
                <CarouselPrevious className="static translate-0 rounded-md" />
                <CarouselNext className="static translate-0 rounded-md" />
              </div>
            </Carousel>
          </div>
        ) : isLoading ? (
          <Carousel
            opts={{ align: "start", dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem key={index} className="basis-auto pl-3">
                  <div className="flex h-44 w-[20rem] overflow-hidden rounded-lg border bg-card sm:w-[24rem]">
                    <Skeleton className="h-full w-28 rounded-none sm:w-32" />
                    <div className="flex flex-1 flex-col justify-between p-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-14" />
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <EmptyState
            compact
            title="No data is available"
            description="Season details are not available yet."
          />
        )}
      </CardContent>
    </Card>
  )
}

function ProductionCompaniesSection({
  companies,
}: {
  companies: NonNullable<TmdbDetail["production_companies"]>
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Production Companies
        </CardTitle>
        <CardDescription>
          Company details from this title response
        </CardDescription>
      </CardHeader>
      <CardContent>
        {companies.length > 0 ? (
          <Carousel
            opts={{ align: "start", dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {companies.map((company) => (
                <CarouselItem key={company.id} className="basis-auto pl-3">
                  <Link
                    to="/company/$companyId"
                    params={{ companyId: String(company.id) }}
                    className="flex h-40 w-60 flex-col justify-between rounded-lg border bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex h-20 items-center justify-center rounded-md bg-muted/60 p-3">
                      <img
                        src={getLogoUrl(company.logo_path)}
                        alt={`${company.name} logo`}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="line-clamp-1 text-sm font-semibold">
                        {company.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {company.origin_country || "Country TBA"}
                      </p>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-3 flex justify-end gap-2">
              <CarouselPrevious className="static translate-0 rounded-md" />
              <CarouselNext className="static translate-0 rounded-md" />
            </div>
          </Carousel>
        ) : (
          <EmptyState
            compact
            title="No data is available"
            description="Production company details are not available yet."
          />
        )}
      </CardContent>
    </Card>
  )
}

function RelatedMediaSection({
  title,
  description,
  items,
  detailBasePath,
  mediaLabel,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  title: string
  description: string
  items: TmdbRelatedItem[]
  detailBasePath: "/movie" | "/series" | "/anime"
  mediaLabel: string
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!carouselApi || items.length === 0) {
      return
    }

    const handleSelect = () => {
      const selectedIndex = carouselApi.selectedScrollSnap()

      if (
        !isLoadingMore &&
        hasMore &&
        (!carouselApi.canScrollNext() || selectedIndex >= items.length - 4)
      ) {
        onLoadMore()
      }
    }

    handleSelect()
    carouselApi.on("select", handleSelect)
    carouselApi.on("reInit", handleSelect)

    return () => {
      carouselApi.off("select", handleSelect)
      carouselApi.off("reInit", handleSelect)
    }
  }, [carouselApi, hasMore, isLoadingMore, items.length, onLoadMore])

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {(hasMore || isLoadingMore) && (
            <Badge variant="secondary" className="rounded-md">
              {isLoadingMore ? "Loading more" : "More available"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <Carousel
            setApi={setCarouselApi}
            opts={{ align: "start", dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {items.map((item) => (
                <CarouselItem key={item.id} className="basis-auto pl-3">
                  <div className="group relative block w-[11rem] sm:w-[12rem]">
                    <Link
                      aria-label={`Open ${getRelatedTitle(item)}`}
                      to={
                        detailBasePath === "/movie"
                          ? "/movie/$mediaId"
                          : detailBasePath === "/series"
                            ? "/series/$mediaId"
                            : "/anime/$mediaId"
                      }
                      params={{ mediaId: String(item.id) }}
                      className="absolute inset-0 z-10 rounded-lg"
                    />
                    <div className="absolute top-2 right-2 z-30">
                      <WatchListButton
                        item={{
                          media_id: item.id,
                          media_type:
                            detailBasePath === "/anime"
                              ? "anime"
                              : detailBasePath === "/series"
                                ? "tv"
                                : "movie",
                          title: getRelatedTitle(item),
                          overview: item.overview,
                          poster_url: getPosterUrl(item.poster_path),
                          background_image_url: getBackdropUrl(
                            item.backdrop_path
                          ),
                          metadata: {
                            rating: item.vote_average,
                            release_year:
                              item.release_date?.slice(0, 4) ??
                              item.first_air_date?.slice(0, 4),
                          },
                        }}
                      />
                    </div>
                    <div className="h-[25rem] overflow-hidden rounded-lg border bg-card transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg sm:h-[26rem]">
                      <div className="relative">
                      <img
                        src={getPosterUrl(item.poster_path)}
                        alt={`${getRelatedTitle(item)} poster`}
                        className="h-[16.5rem] w-full object-cover sm:h-[18rem]"
                        loading="lazy"
                      />
                      </div>
                      <div className="space-y-2 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-md text-xs"
                          >
                            {mediaLabel}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {formatRating(item.vote_average)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm font-semibold">
                          {getRelatedTitle(item)}
                        </p>
                        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {item.overview || "No description available yet."}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
              {isLoadingMore && (
                <CarouselItem className="basis-auto pl-3">
                  <div className="h-[25rem] w-[11rem] overflow-hidden rounded-lg border bg-card p-3 sm:h-[26rem] sm:w-[12rem]">
                    <Skeleton className="h-[16.5rem] w-full rounded-md sm:h-[18rem]" />
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <div className="mt-3 flex justify-end gap-2">
              <CarouselPrevious className="static translate-0 rounded-md" />
              <CarouselNext className="static translate-0 rounded-md" />
            </div>
          </Carousel>
        ) : (
          <EmptyState
            compact
            title="No data is available"
            description={`${title} titles are not available yet.`}
          />
        )}
      </CardContent>
    </Card>
  )
}
