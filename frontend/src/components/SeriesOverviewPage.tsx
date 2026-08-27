import { Fragment, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Clapperboard,
  Grid3x3,
  Layers3,
  Play,
  TrendingUp,
  Star,
  UserRound,
} from "lucide-react"
import { Link } from "@tanstack/react-router"

import { EmptyState } from "@/components/EmptyState"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchApiData } from "@/service/fetchApiData"

type EndpointConfig = {
  method: "GET"
  api: string
}

type SeriesOverviewPageProps = {
  id: string
  detailEndpoint: EndpointConfig
  seasonEndpoint: EndpointConfig
  mediaLabel: "Series" | "Anime"
  detailBasePath: "/series" | "/anime"
}

type SeasonDetailPageProps = SeriesOverviewPageProps & {
  seasonNumber: string
}

type TmdbSeriesDetail = {
  id: number
  name?: string
  original_name?: string
  tagline?: string
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average?: number
  vote_count?: number
  first_air_date?: string
  last_air_date?: string
  number_of_seasons?: number
  number_of_episodes?: number
  genres?: TmdbGenre[]
  created_by?: TmdbCreator[]
  images?: {
    backdrops?: TmdbImage[]
    posters?: TmdbImage[]
  }
  seasons?: TmdbSeasonSummary[]
}

type TmdbGenre = {
  id: number
  name: string
}

type TmdbCreator = {
  id: number
  name: string
  original_name?: string
  profile_path: string | null
}

type TmdbImage = {
  file_path: string
  vote_average?: number
}

type TmdbSeasonSummary = {
  id: number
  name: string
  overview?: string
  season_number: number
  episode_count: number
  air_date?: string | null
  poster_path: string | null
  vote_average?: number
}

type TmdbEpisode = {
  id: number
  name: string
  overview?: string
  episode_number: number
  season_number: number
  air_date?: string | null
  still_path?: string | null
  vote_average?: number
  vote_count?: number
  runtime?: number | null
  crew?: TmdbEpisodePerson[]
  guest_stars?: TmdbEpisodePerson[]
}

type TmdbEpisodePerson = {
  id: number
  name: string
  original_name?: string
  job?: string
  character?: string
  profile_path: string | null
}

type TmdbSeasonDetail = TmdbSeasonSummary & {
  episodes?: TmdbEpisode[]
}

const posterBaseUrl = "https://image.tmdb.org/t/p/w342"
const backdropBaseUrl = "https://image.tmdb.org/t/p/w1280"
const stillBaseUrl = "https://image.tmdb.org/t/p/w500"
const profileBaseUrl = "https://image.tmdb.org/t/p/w185"
const fallbackPoster =
  "https://placehold.co/342x513/111111/fafafa?text=No+Poster"

function resolveEndpoint(endpoint: string, id: string) {
  return endpoint.replace("{series_id}", id)
}

function resolveSeasonEndpoint(endpoint: string, id: string, seasonNumber: number) {
  return resolveEndpoint(endpoint, id).replace(
    "{season_number}",
    String(seasonNumber)
  )
}

function getTitle(detail: TmdbSeriesDetail) {
  return detail.name ?? "Untitled"
}

function getOriginalTitle(detail: TmdbSeriesDetail) {
  return detail.original_name && detail.original_name !== detail.name
    ? detail.original_name
    : null
}

function getPosterUrl(path: string | null) {
  return path ? `${posterBaseUrl}${path}` : fallbackPoster
}

function getBackdropUrl(path: string | null) {
  return path ? `${backdropBaseUrl}${path}` : null
}

function getStillUrl(path?: string | null) {
  return path ? `${stillBaseUrl}${path}` : null
}

function getProfileUrl(path: string | null) {
  return path ? `${profileBaseUrl}${path}` : null
}

function getYear(value?: string | null) {
  if (!value) {
    return "TBA"
  }

  return new Date(value).getFullYear().toString()
}

function formatDate(value?: string | null) {
  if (!value) {
    return "TBA"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatRating(rating?: number) {
  return rating && rating > 0 ? rating.toFixed(1) : "NR"
}

function hasRating(rating?: number) {
  return Boolean(rating && rating > 0)
}

function formatTrendRating(rating?: number) {
  if (typeof rating !== "number" || rating <= 0) {
    return ""
  }

  return rating.toFixed(1)
}

function getHeroSlides(detail: TmdbSeriesDetail) {
  const backdrops =
    detail.images?.backdrops
      ?.filter((image) => Boolean(image.file_path))
      .sort(
        (firstImage, secondImage) =>
          (secondImage.vote_average ?? 0) - (firstImage.vote_average ?? 0)
      )
      .slice(0, 8)
      .map((image) => image.file_path) ?? []

  return Array.from(
    new Set([detail.backdrop_path, ...backdrops].filter(Boolean) as string[])
  )
}

function SeriesOverviewSkeleton() {
  return (
    <section className="-mx-2 -mt-6 bg-background sm:-mx-3">
      <Skeleton className="h-[36rem] w-full rounded-none" />
      <div className="mx-auto max-w-7xl space-y-4 px-3 py-8 sm:px-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </section>
  )
}

function SeasonDetailSkeleton() {
  return (
    <section className="-mx-2 -mt-6 bg-background sm:-mx-3">
      <Skeleton className="h-[34rem] w-full rounded-none" />
      <div className="mx-auto max-w-7xl space-y-4 px-3 py-8 sm:px-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </section>
  )
}

export function SeriesOverviewPage({
  id,
  detailEndpoint,
  seasonEndpoint,
  mediaLabel,
  detailBasePath,
}: SeriesOverviewPageProps) {
  const [detail, setDetail] = useState<TmdbSeriesDetail | null>(null)
  const [seasons, setSeasons] = useState<TmdbSeasonDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeTab, setActiveTab] = useState<
    "overview" | "season-ratings" | "rating-trends" | "rating-heatmap"
  >("overview")
  const detailUrl = useMemo(
    () => resolveEndpoint(detailEndpoint.api, id),
    [detailEndpoint.api, id]
  )

  useEffect(() => {
    const abortController = new AbortController()

    async function loadOverview() {
      setLoading(true)
      setError(false)
      setActiveSlide(0)

      const detailResponse = await fetchApiData<TmdbSeriesDetail>({
        endpoint: detailUrl,
        method: detailEndpoint.method,
        params: {
          language: "en-US",
          append_to_response: "images",
        },
        signal: abortController.signal,
      })

      if (abortController.signal.aborted) {
        return
      }

      setDetail(detailResponse)
      setError(!detailResponse)

      const seasonSummaries =
        detailResponse?.seasons
          ?.filter((season) => season.season_number > 0 && season.episode_count > 0)
          .sort(
            (firstSeason, secondSeason) =>
              firstSeason.season_number - secondSeason.season_number
          ) ?? []

      const seasonResponses = await Promise.all(
        seasonSummaries.map((season) =>
          fetchApiData<TmdbSeasonDetail>({
            endpoint: resolveSeasonEndpoint(
              seasonEndpoint.api,
              id,
              season.season_number
            ),
            method: seasonEndpoint.method,
            params: {
              language: "en-US",
            },
            signal: abortController.signal,
          })
        )
      )

      if (abortController.signal.aborted) {
        return
      }

      setSeasons(
        seasonResponses
          .filter((season): season is TmdbSeasonDetail => Boolean(season))
          .filter((season) => Boolean(season.episodes?.length))
      )
      setLoading(false)
    }

    void loadOverview()

    return () => abortController.abort()
  }, [detailEndpoint.method, detailUrl, id, seasonEndpoint.api, seasonEndpoint.method])

  const heroSlides = useMemo(
    () => (detail ? getHeroSlides(detail) : []),
    [detail]
  )

  useEffect(() => {
    if (heroSlides.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length)
    }, 6500)

    return () => window.clearInterval(intervalId)
  }, [heroSlides.length])

  if (loading) {
    return <SeriesOverviewSkeleton />
  }

  if (error || !detail) {
    return (
      <section className="-mx-2 -mt-6 min-h-screen bg-background px-3 py-24 sm:-mx-3 sm:px-4">
        <EmptyState
          className="mx-auto max-w-2xl"
          title="No data is available"
          description="We could not load this overview from TMDB right now."
        />
      </section>
    )
  }

  const activeBackdrop = getBackdropUrl(heroSlides[activeSlide] ?? null)

  return (
    <section className="-mx-2 -mt-6 bg-background sm:-mx-3">
      <section className="relative isolate min-h-[min(58rem,100svh)] overflow-hidden bg-black text-white sm:min-h-[44rem] lg:min-h-[40rem]">
        {activeBackdrop && (
          <img
            src={activeBackdrop}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-700"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="mx-auto grid min-h-[min(58rem,100svh)] max-w-7xl content-end gap-6 px-5 pt-56 pb-36 sm:min-h-[44rem] sm:px-5 sm:pt-36 sm:pb-24 md:pt-32 lg:min-h-[40rem] lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-end lg:px-4 lg:pt-32 lg:pb-20">
          <img
            src={getPosterUrl(detail.poster_path)}
            alt={getTitle(detail)}
            className="hidden aspect-[2/3] w-full rounded-lg border border-white/15 object-cover shadow-2xl shadow-black/50 lg:block"
          />

          <div className="max-w-4xl space-y-4 sm:space-y-5 lg:pb-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Badge className="rounded-md border border-white/15 bg-white/12 text-xs text-white hover:bg-white/12 sm:text-sm">
                {mediaLabel}
              </Badge>
              <Badge className="rounded-md border border-white/15 bg-white/12 text-xs text-white hover:bg-white/12 sm:text-sm">
                {detail.number_of_seasons ?? seasons.length} seasons
              </Badge>
              <Badge className="rounded-md border border-white/15 bg-white/12 text-xs text-white hover:bg-white/12 sm:text-sm">
                {detail.number_of_episodes ?? 0} episodes
              </Badge>
            </div>

            <div>
              <h1 className="max-w-3xl text-[clamp(3rem,14vw,5.75rem)] font-bold leading-[0.92] sm:text-7xl sm:leading-none">
                {getTitle(detail)}
              </h1>
              {getOriginalTitle(detail) && (
                <p className="mt-2 text-sm font-medium text-white/62 sm:mt-3 sm:text-base">
                  Original: {getOriginalTitle(detail)}
                </p>
              )}
              <p className="mt-3 line-clamp-2 max-w-2xl text-base leading-6 text-white/74 sm:line-clamp-3 sm:text-lg sm:leading-7">
                {detail.tagline || detail.overview || "Overview is not available yet."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 font-bold text-black">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                {formatRating(detail.vote_average)}
              </span>
              <span className="text-white/58">
                {detail.vote_count?.toLocaleString() ?? 0} votes
              </span>
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <CalendarDays className="h-4 w-4" />
                {getYear(detail.first_air_date)} - {getYear(detail.last_air_date)}
              </span>
            </div>

            {detail.genres && detail.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {detail.genres.map((genre) => (
                  <Badge
                    key={genre.id}
                    className="rounded-md border border-white/15 bg-white/10 text-xs text-white hover:bg-white/10 sm:text-sm"
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            <CreatorList creators={detail.created_by ?? []} />

            <div className="flex flex-wrap gap-2">
              <Button asChild className="h-10 rounded-md bg-white px-4 text-sm text-black hover:bg-white/90">
                <Link
                  to={
                    detailBasePath === "/anime"
                      ? "/anime/$mediaId"
                      : "/series/$mediaId"
                  }
                  params={{ mediaId: id }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to details
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {heroSlides.length > 1 && (
          <div className="absolute right-5 bottom-8 left-5 flex justify-center gap-2 sm:right-4 sm:bottom-6 sm:left-auto sm:justify-end">
            {heroSlides.map((slide, slideIndex) => (
              <button
                key={slide}
                type="button"
                aria-label={`Show background ${slideIndex + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  slideIndex === activeSlide
                    ? "w-10 bg-white"
                    : "w-4 bg-white/35 hover:bg-white/65"
                }`}
                onClick={() => setActiveSlide(slideIndex)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-3 py-8 sm:px-4 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              type="button"
              variant={activeTab === "overview" ? "default" : "ghost"}
              className={`rounded-md ${
                activeTab === "overview"
                  ? ""
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              <Layers3 className="h-4 w-4" />
              Overview
            </Button>
            <Button
              type="button"
              variant={activeTab === "season-ratings" ? "default" : "ghost"}
              className={`rounded-md ${
                activeTab === "season-ratings"
                  ? ""
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setActiveTab("season-ratings")}
            >
              <Clapperboard className="h-4 w-4" />
              Season Ratings
            </Button>
            <Button
              type="button"
              variant={activeTab === "rating-trends" ? "default" : "ghost"}
              className={`rounded-md ${
                activeTab === "rating-trends"
                  ? ""
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setActiveTab("rating-trends")}
            >
              <TrendingUp className="h-4 w-4" />
              Rating Trends
            </Button>
            <Button
              type="button"
              variant={activeTab === "rating-heatmap" ? "default" : "ghost"}
              className={`rounded-md ${
                activeTab === "rating-heatmap"
                  ? ""
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setActiveTab("rating-heatmap")}
            >
              <Grid3x3 className="h-4 w-4" />
              Rating Heatmap
            </Button>
          </div>
          <Badge variant="outline" className="rounded-md">
            {seasons.length} seasons loaded
          </Badge>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-3 gap-1 rounded-md">
                  <Layers3 className="h-3.5 w-3.5" />
                  Season overview
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight">
                  Seasons and episodes
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Season-wise episode panels with crew, guest stars, vote average,
                  artwork, dates, runtime, and overview text from the selected title.
                </p>
              </div>
            </div>

            {seasons.length > 0 ? (
              <div className="space-y-4">
                {seasons.map((season) => (
                  <SeasonOverviewCard key={season.id} season={season} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                Season and episode overview data is not available yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "season-ratings" && (
          <SeasonRatingsPanel seasons={seasons} detail={detail} />
        )}

        {activeTab === "rating-trends" && (
          <RatingTrendsPanel seasons={seasons} detail={detail} />
        )}

        {activeTab === "rating-heatmap" && (
          <RatingHeatmapPanel seasons={seasons} detail={detail} />
        )}
      </section>
    </section>
  )
}

export function SeasonDetailPage({
  id,
  seasonNumber,
  detailEndpoint,
  seasonEndpoint,
  mediaLabel,
  detailBasePath,
}: SeasonDetailPageProps) {
  const [detail, setDetail] = useState<TmdbSeriesDetail | null>(null)
  const [season, setSeason] = useState<TmdbSeasonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const numericSeasonNumber = Number(seasonNumber)
  const detailUrl = useMemo(
    () => resolveEndpoint(detailEndpoint.api, id),
    [detailEndpoint.api, id]
  )
  const seasonUrl = useMemo(
    () =>
      Number.isFinite(numericSeasonNumber)
        ? resolveSeasonEndpoint(seasonEndpoint.api, id, numericSeasonNumber)
        : "",
    [id, numericSeasonNumber, seasonEndpoint.api]
  )

  useEffect(() => {
    const abortController = new AbortController()

    async function loadSeasonDetail() {
      if (!seasonUrl) {
        setLoading(false)
        setError(true)
        return
      }

      setLoading(true)
      setError(false)

      const [detailResponse, seasonResponse] = await Promise.all([
        fetchApiData<TmdbSeriesDetail>({
          endpoint: detailUrl,
          method: detailEndpoint.method,
          params: {
            language: "en-US",
            append_to_response: "images",
          },
          signal: abortController.signal,
        }),
        fetchApiData<TmdbSeasonDetail>({
          endpoint: seasonUrl,
          method: seasonEndpoint.method,
          params: {
            language: "en-US",
            append_to_response: "credits,images,videos",
          },
          signal: abortController.signal,
        }),
      ])

      if (abortController.signal.aborted) {
        return
      }

      setDetail(detailResponse)
      setSeason(seasonResponse)
      setError(!detailResponse || !seasonResponse)
      setLoading(false)
    }

    void loadSeasonDetail()

    return () => abortController.abort()
  }, [
    detailEndpoint.method,
    detailUrl,
    seasonEndpoint.method,
    seasonUrl,
  ])

  if (loading) {
    return <SeasonDetailSkeleton />
  }

  if (error || !detail || !season) {
    return (
      <section className="-mx-2 -mt-6 min-h-screen bg-background px-3 py-24 sm:-mx-3 sm:px-4">
        <EmptyState
          className="mx-auto max-w-2xl"
          title="No data is available"
          description="We could not load this season from TMDB right now."
        />
      </section>
    )
  }

  const backdropUrl = getBackdropUrl(detail.backdrop_path)
  const episodeCount = season.episodes?.length ?? season.episode_count
  const averageRuntime = getAverageRuntime(season.episodes ?? [])

  return (
    <section className="-mx-2 -mt-6 bg-background sm:-mx-3">
      <section className="relative isolate min-h-[min(56rem,100svh)] overflow-hidden bg-black text-white sm:min-h-[42rem] lg:min-h-[38rem]">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-black/45" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="mx-auto grid min-h-[min(56rem,100svh)] max-w-7xl content-end gap-6 px-5 pt-52 pb-24 sm:min-h-[42rem] sm:px-5 sm:pt-36 lg:min-h-[38rem] lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-end lg:px-4 lg:pt-32 lg:pb-18">
          <img
            src={getPosterUrl(season.poster_path ?? detail.poster_path)}
            alt={season.name}
            className="hidden aspect-[2/3] w-full rounded-lg border border-white/15 object-cover shadow-2xl shadow-black/50 lg:block"
          />

          <div className="max-w-4xl space-y-4 lg:pb-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-md border border-white/15 bg-white/12 text-white hover:bg-white/12">
                {mediaLabel}
              </Badge>
              <Badge className="rounded-md border border-white/15 bg-white/12 text-white hover:bg-white/12">
                Season {season.season_number}
              </Badge>
              <Badge className="rounded-md border border-white/15 bg-white/12 text-white hover:bg-white/12">
                ID {season.id}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                {getTitle(detail)}
              </p>
              <h1 className="mt-2 max-w-4xl text-[clamp(2.75rem,12vw,5.25rem)] font-bold leading-[0.94] sm:text-7xl sm:leading-none">
                {season.name}
              </h1>
              <p className="mt-3 line-clamp-3 max-w-2xl text-base leading-6 text-white/74 sm:text-lg sm:leading-7">
                {season.overview || detail.overview || "Season overview is not available yet."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 font-bold text-black">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                {formatRating(season.vote_average)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-white/72">
                <CalendarDays className="h-4 w-4" />
                {formatDate(season.air_date)}
              </span>
              <span className="text-white/58">{episodeCount} episodes</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild className="h-10 rounded-md bg-white px-4 text-sm text-black hover:bg-white/90">
                <Link
                  to={
                    detailBasePath === "/anime"
                      ? "/anime/$mediaId"
                      : "/series/$mediaId"
                  }
                  params={{ mediaId: id }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to details
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-md border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-white/18 hover:text-white"
              >
                <Link
                  to={
                    detailBasePath === "/anime"
                      ? "/anime/$mediaId/overview"
                      : "/series/$mediaId/overview"
                  }
                  params={{ mediaId: id }}
                >
                  <Layers3 className="h-4 w-4" />
                  Series overview
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-3 py-8 sm:px-4 lg:py-10">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SeasonMetricCard label="Season id" value={`${season.id}`} detail="TMDB season reference" />
          <SeasonMetricCard label="Air date" value={formatDate(season.air_date)} detail="First episode air date" />
          <SeasonMetricCard label="Episodes" value={`${episodeCount}`} detail="Loaded from season details" />
          <SeasonMetricCard label="Runtime" value={averageRuntime ? `${averageRuntime} min avg` : "TBA"} detail="Average episode runtime" />
        </div>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b p-4 sm:p-5">
            <Badge variant="secondary" className="mb-3 gap-1 rounded-md">
              <Clapperboard className="h-3.5 w-3.5" />
              Season details
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight">
              Episodes in {season.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Episode artwork, air dates, runtime, ratings, crew, and guest stars from TMDB.
            </p>
          </div>

          <div className="p-4 sm:p-5">
            {season.episodes && season.episodes.length > 0 ? (
              <Accordion
                type="multiple"
                className="space-y-2"
                defaultValue={season.episodes
                  .slice(0, 1)
                  .map((episode) => `${episode.id}`)}
              >
                {season.episodes.map((episode) => (
                  <EpisodeAccordionItem key={episode.id} episode={episode} />
                ))}
              </Accordion>
            ) : (
              <EmptyState
                title="No data is available"
                description="Episode details are not available for this season yet."
              />
            )}
          </div>
        </section>
      </section>
    </section>
  )
}

function CreatorList({ creators }: { creators: TmdbCreator[] }) {
  if (creators.length === 0) {
    return null
  }

  return (
    <div className="flex max-w-full gap-2 overflow-x-auto pb-1 sm:gap-3">
      {creators.map((creator) => {
        const profileUrl = getProfileUrl(creator.profile_path)

        return (
          <Link
            key={creator.id}
            to="/person/$personId"
            params={{ personId: String(creator.id) }}
            className="flex min-w-[14rem] max-w-full items-center gap-3 rounded-lg border border-white/12 bg-white/10 p-2 backdrop-blur-md sm:min-w-48"
          >
            {profileUrl ? (
              <img
                src={profileUrl}
                alt={creator.name}
                className="h-12 w-12 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/12 text-white/58">
                <UserRound className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase text-white/48">Created by</p>
              <p className="truncate text-sm font-semibold text-white">
                {creator.name}
              </p>
              {creator.original_name && creator.original_name !== creator.name && (
                <p className="truncate text-xs text-white/45">
                  {creator.original_name}
                </p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function SeasonMetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function SeasonRatingsPanel({
  seasons,
  detail,
}: {
  seasons: TmdbSeasonDetail[]
  detail: TmdbSeriesDetail
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="border-b bg-muted/25 p-4 lg:border-b-0 lg:border-r">
          <img
            src={getPosterUrl(detail.poster_path)}
            alt={getTitle(detail)}
            className="aspect-[2/3] w-32 rounded-lg border object-cover shadow-sm sm:w-40 lg:w-full"
          />
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{formatRating(detail.vote_average)}</span>
              <span className="text-sm font-medium text-muted-foreground">
                ({detail.vote_count?.toLocaleString() ?? 0})
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-none">{getTitle(detail)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {getYear(detail.first_air_date)} - {getYear(detail.last_air_date)}
              </p>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
              <p className="text-base font-bold tracking-[0.16em]">Quantum Clap</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Season rating cards
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1 rounded-md">
                <Clapperboard className="h-3.5 w-3.5" />
                Season Ratings
              </Badge>
              <h3 className="text-xl font-bold sm:text-2xl">
                Episode ratings by season
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Clean season groups with every episode score and season average.
              </p>
            </div>
            <RatingLegend />
          </div>

          {seasons.length > 0 ? (
            <div className="space-y-5">
              {seasons.map((season) => {
                const average = getSeasonAverage(season)

                return (
                  <section key={season.id} className="space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h4 className="text-base font-semibold">
                        Season {season.season_number}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        avg {formatTrendRating(average) || "NR"}
                      </span>
                    </div>

                    {season.episodes && season.episodes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {season.episodes.map((episode) => {
                          const hasEpisodeRating = hasRating(episode.vote_average)

                          return (
                            <div
                              key={episode.id}
                              className={
                                hasEpisodeRating
                                  ? `grid h-9 w-12 grid-rows-[0.6rem_minmax(0,1fr)] rounded-sm px-1.5 py-0.5 shadow-sm ${getRatingClass(
                                      episode.vote_average
                                    )}`
                                  : "grid h-9 w-12 grid-rows-[0.6rem_minmax(0,1fr)] rounded-sm border bg-muted/35 px-1.5 py-0.5 text-muted-foreground"
                              }
                              title={episode.name}
                            >
                              <span className="text-[0.55rem] font-medium leading-none opacity-80">
                                E{episode.episode_number}
                              </span>
                              <span className="self-center text-center text-[0.7rem] font-bold leading-none tabular-nums">
                                {formatTrendRating(episode.vote_average) || "NR"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        Episode ratings are not available for this season.
                      </p>
                    )}
                  </section>
                )
              })}
            </div>
          ) : (
            <p className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
              Season rating data is not available yet.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function RatingTrendsPanel({
  seasons,
  detail,
}: {
  seasons: TmdbSeasonDetail[]
  detail: TmdbSeriesDetail
}) {
  const maxEpisodeCount = Math.max(
    ...seasons.map((season) => season.episodes?.length ?? 0),
    0
  )

  return (
    <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="border-b bg-muted/25 p-4 lg:border-b-0 lg:border-r">
          <img
            src={getPosterUrl(detail.poster_path)}
            alt={getTitle(detail)}
            className="aspect-[2/3] w-32 rounded-lg border object-cover shadow-sm sm:w-40 lg:w-full"
          />
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{formatRating(detail.vote_average)}</span>
              <span className="text-sm font-medium text-muted-foreground">
                ({detail.vote_count?.toLocaleString() ?? 0})
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-none">{getTitle(detail)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {getYear(detail.first_air_date)} - {getYear(detail.last_air_date)}
              </p>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
              <p className="text-base font-bold tracking-[0.16em]">Quantum Clap</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Episode rating trends
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="secondary" className="mb-3 rounded-md">
                Rating Trends
              </Badge>
              <h3 className="text-xl font-bold sm:text-2xl">
                Season rating matrix
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Rows are episode numbers, columns are seasons, and each cell uses
                TMDB vote average from that episode.
              </p>
            </div>
            <RatingLegend />
          </div>

          {seasons.length > 0 ? (
            <div className="overflow-x-auto pb-2">
              <div
                className="grid min-w-max gap-[1px]"
                style={{
                  gridTemplateColumns: `minmax(1rem, 4.5ch) repeat(${seasons.length}, minmax(3.5rem, 4rem))`,
                }}
              >
                <div />
                {seasons.map((season) => (
                  <div
                    key={season.id}
                    className="flex h-8 items-center justify-center rounded-sm border border-border/70 bg-muted/40 px-1 text-center shadow-sm"
                  >
                    <p className="text-[0.7rem] font-medium leading-none text-foreground/90">
                      S{season.season_number}
                    </p>
                  </div>
                ))}

                {Array.from({ length: maxEpisodeCount }).map((_, episodeIndex) => (
                  <Fragment key={episodeIndex}>
                    <div className="flex h-8 items-center justify-start pl-1 text-left text-[0.7rem] font-medium leading-none uppercase tabular-nums text-foreground/85">
                      E{episodeIndex + 1}
                    </div>
                    {seasons.map((season) => {
                      const episode = season.episodes?.[episodeIndex]
                      const hasEpisodeRating = hasRating(episode?.vote_average)

                      return (
                        <div
                          key={`${season.id}-${episodeIndex}`}
                          className={
                            hasEpisodeRating
                              ? `flex h-8 items-center justify-center rounded-sm text-[0.7rem] font-semibold leading-none ${getRatingClass(
                                  episode?.vote_average
                                )}`
                              : "h-8 rounded-sm"
                          }
                          title={hasEpisodeRating ? episode?.name : undefined}
                        >
                          {formatTrendRating(episode?.vote_average)}
                        </div>
                      )
                    })}
                  </Fragment>
                ))}

                <div className="flex h-8 items-center justify-start pl-1 text-left text-[0.58rem] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                  AVG.
                </div>
                {seasons.map((season) => {
                  const average = getSeasonAverage(season)
                  const hasAverage = hasRating(average)

                  return (
                    <div
                      key={`avg-${season.id}`}
                      className={
                        hasAverage
                          ? `flex h-8 items-center justify-center rounded-sm text-[0.7rem] font-semibold leading-none ${getRatingClass(
                              average
                            )}`
                          : "h-8 rounded-sm"
                      }
                    >
                      {formatTrendRating(average)}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
              Rating trend data is not available yet.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function RatingHeatmapPanel({
  seasons,
  detail,
}: {
  seasons: TmdbSeasonDetail[]
  detail: TmdbSeriesDetail
}) {
  const maxEpisodeCount = Math.max(
    ...seasons.map((season) => season.episodes?.length ?? 0),
    0
  )

  return (
    <section className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="border-b bg-muted/25 p-4 lg:border-b-0 lg:border-r">
          <img
            src={getPosterUrl(detail.poster_path)}
            alt={getTitle(detail)}
            className="aspect-[2/3] w-32 rounded-lg border object-cover shadow-sm sm:w-40 lg:w-full"
          />
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{formatRating(detail.vote_average)}</span>
              <span className="text-sm font-medium text-muted-foreground">
                ({detail.vote_count?.toLocaleString() ?? 0})
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-none">{getTitle(detail)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {getYear(detail.first_air_date)} - {getYear(detail.last_air_date)}
              </p>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
              <p className="text-base font-bold tracking-[0.16em]">Quantum Clap</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Rating heatmap
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-4">
            <Badge variant="secondary" className="mb-2 rounded-md">
              <Grid3x3 className="mr-1 h-3.5 w-3.5" />
              Rating Heatmap
            </Badge>
            <p className="text-sm text-muted-foreground">
              Rows are seasons, columns are episodes. Hover a cell for rating.
            </p>
          </div>

          {seasons.length > 0 ? (
            <div className="overflow-visible">
              <table className="border-separate border-spacing-[1px]">
                <thead>
                  <tr>
                    <th />
                    {Array.from({ length: maxEpisodeCount }).map((_, i) => (
                      <th
                        key={i}
                        className="px-1 text-center text-[0.65rem] font-bold text-muted-foreground"
                      >
                        E{i + 1}
                      </th>
                    ))}
                    <th className="px-1 text-center text-[0.55rem] font-bold uppercase tracking-widest text-muted-foreground">
                      AVG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season) => {
                    const avg = getSeasonAverage(season)

                    return (
                      <tr key={season.id}>
                        <td className="pr-1.5 text-right text-[0.65rem] font-bold tabular-nums text-muted-foreground">
                          S{season.season_number}
                        </td>
                        {Array.from({ length: maxEpisodeCount }).map((_, ei) => {
                          const ep = season.episodes?.[ei]
                          const r = ep?.vote_average ?? 0

                          return (
                            <td
                              key={ei}
                              className="group/cell relative h-7 w-7 cursor-default"
                            >
                              <div
                                className="h-full w-full rounded-[2px] transition"
                                style={
                                  r > 0
                                    ? { backgroundColor: getRatingClassColor(r) }
                                    : { backgroundColor: "hsl(var(--muted))" }
                                }
                              >
                                {r > 0 && ep && (
                                  <span className="absolute top-full left-1/2 z-50 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1.5 text-popover-foreground shadow-md group-hover/cell:block">
                                    <span className="block text-[0.6rem] font-bold leading-tight">
                                      S{season.season_number} E{ep.episode_number}
                                    </span>
                                    <span className="block truncate text-[0.58rem] leading-tight text-muted-foreground">
                                      {ep.name}
                                    </span>
                                    <span className="mt-0.5 block text-[0.6rem] font-bold">
                                      {r.toFixed(1)}/10
                                    </span>
                                    <span className="block text-[0.55rem] text-muted-foreground">
                                      {formatDate(ep.air_date)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </td>
                      )
                    })}
                    <td className="group/cell relative h-7 w-7">
                          <div
                            className="h-full w-full rounded-[2px]"
                            style={
                              avg > 0
                                ? { backgroundColor: getRatingClassColor(avg) }
                                : { backgroundColor: "hsl(var(--muted))" }
                            }
                          >
                            {avg > 0 && (
                              <span className="absolute top-full left-1/2 z-50 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[0.58rem] font-semibold text-popover-foreground shadow-md group-hover/cell:block">
                                S{season.season_number} avg · {avg.toFixed(1)}/10
                              </span>
                            )}
                          </div>
                        </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
            <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              No data available.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function getRatingClassColor(rating: number): string {
  if (rating >= 9.6) return "#006dff"
  if (rating >= 9) return "#007814"
  if (rating >= 8) return "#00d821"
  if (rating >= 7) return "#ffc51b"
  if (rating >= 6) return "#ff8417"
  if (rating >= 5) return "#ff1010"
  return "#8d16ff"
}

function getSeasonAverage(season: TmdbSeasonDetail) {
  const ratings =
    season.episodes
      ?.map((episode) => episode.vote_average ?? 0)
      .filter((rating) => rating > 0) ?? []

  if (ratings.length === 0) {
    return 0
  }

  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length
}

function getAverageRuntime(episodes: TmdbEpisode[]) {
  const runtimes = episodes
    .map((episode) => episode.runtime ?? 0)
    .filter((runtime) => runtime > 0)

  if (runtimes.length === 0) {
    return 0
  }

  return Math.round(
    runtimes.reduce((total, runtime) => total + runtime, 0) / runtimes.length
  )
}

function getRatingClass(rating?: number) {
  if (typeof rating !== "number" || rating <= 0) {
    return ""
  }

  if (rating >= 9.6) {
    return "bg-[#006dff] text-slate-100"
  }

  if (rating >= 9) {
    return "bg-[#007814] text-slate-100"
  }

  if (rating >= 8) {
    return "bg-[#00d821] text-[#06210b]"
  }

  if (rating >= 7) {
    return "bg-[#ffc51b] text-[#1f2937]"
  }

  if (rating >= 6) {
    return "bg-[#ff8417] text-[#1f2937]"
  }

  if (rating >= 5) {
    return "bg-[#ff1010] text-slate-100"
  }

  return "bg-[#8d16ff] text-slate-100"
}

function RatingLegend() {
  const items = [
    { label: "Absolute Cinema", color: "#006dff" },
    { label: "Awesome", color: "#007814" },
    { label: "Great", color: "#00d821" },
    { label: "Good", color: "#ffc51b" },
    { label: "Average", color: "#ff8417" },
    { label: "Bad", color: "#ff1010" },
    { label: "Garbage", color: "#8d16ff" },
  ]

  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2 text-sm">
          <span
            className="h-5 w-5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </div>
      ))}
    </div>
  )
}

function SeasonOverviewCard({ season }: { season: TmdbSeasonDetail }) {
  return (
    <article className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="border-b bg-muted/35 p-4 lg:border-b-0 lg:border-r">
          <div className="flex gap-4 lg:block">
            <img
              src={getPosterUrl(season.poster_path)}
              alt={season.name}
              className="aspect-[2/3] w-24 rounded-md object-cover shadow-sm lg:w-full"
            />
            <div className="min-w-0 space-y-3 lg:mt-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold">{season.name}</h3>
                  <Badge variant="secondary" className="rounded-md">
                    S{season.season_number}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(season.air_date)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1 rounded-md">
                  <Clapperboard className="h-3.5 w-3.5" />
                  {season.episodes?.length ?? season.episode_count} episodes
                </Badge>
                <Badge variant="outline" className="gap-1 rounded-md">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {formatRating(season.vote_average)}
                </Badge>
              </div>
              <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">
                {season.overview || "Season overview is not available yet."}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Episode overview
            </h4>
            <Badge variant="secondary" className="rounded-md">
              {season.episodes?.length ?? 0}
            </Badge>
          </div>
          <Accordion
            type="multiple"
            className="space-y-2"
            defaultValue={season.episodes?.slice(0, 1).map((episode) => `${episode.id}`)}
          >
            {season.episodes?.map((episode) => (
              <EpisodeAccordionItem key={episode.id} episode={episode} />
            ))}
          </Accordion>
        </div>
      </div>
    </article>
  )
}

function EpisodeAccordionItem({ episode }: { episode: TmdbEpisode }) {
  const stillUrl = getStillUrl(episode.still_path)

  return (
    <AccordionItem
      value={`${episode.id}`}
      className="overflow-hidden rounded-lg border bg-background px-0 last:border-b"
    >
      <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
        <div className="grid w-full min-w-0 gap-3 pr-3 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center">
          {stillUrl ? (
            <img
              src={stillUrl}
              alt={episode.name}
              className="aspect-video w-full rounded-md object-cover sm:w-24"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted text-muted-foreground sm:w-24">
              <Play className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[0.68rem]">
                E{episode.episode_number}
              </Badge>
              <h5 className="line-clamp-1 text-base font-semibold">
                {episode.name}
              </h5>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(episode.air_date)}
              {episode.runtime ? ` • ${episode.runtime} min` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            <Badge variant="outline" className="gap-1 rounded-md px-1.5 py-0 text-[0.7rem]">
              <Star className="h-3 w-3 fill-current" />
              {formatRating(episode.vote_average)}
            </Badge>
            <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[0.7rem]">
              {episode.vote_count?.toLocaleString() ?? 0} votes
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Overview
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {episode.overview || "Episode overview is not available yet."}
              </p>
            </div>
            <EpisodePeopleSection
              title="Crew"
              people={episode.crew ?? []}
              emptyText="Crew data is not available for this episode."
              metaKey="job"
            />
            <EpisodePeopleSection
              title="Guest stars"
              people={episode.guest_stars ?? []}
              emptyText="Guest star data is not available for this episode."
              metaKey="character"
            />
          </div>

          <div className="grid content-start gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2 xl:grid-cols-1">
            <EpisodeMetric label="Vote average" value={formatRating(episode.vote_average)} />
            <EpisodeMetric
              label="Vote count"
              value={episode.vote_count?.toLocaleString() ?? "0"}
            />
            <EpisodeMetric label="Air date" value={formatDate(episode.air_date)} />
            <EpisodeMetric
              label="Runtime"
              value={episode.runtime ? `${episode.runtime} min` : "TBA"}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function EpisodeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

function EpisodePeopleSection({
  title,
  people,
  emptyText,
  metaKey,
}: {
  title: string
  people: TmdbEpisodePerson[]
  emptyText: string
  metaKey: "job" | "character"
}) {
  const visiblePeople = people.slice(0, 12)

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <Badge variant="secondary" className="rounded-md">
          {people.length}
        </Badge>
      </div>
      {visiblePeople.length > 0 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {visiblePeople.map((person) => (
            <PersonMiniCard
              key={`${title}-${person.id}-${person[metaKey] ?? person.name}`}
              person={person}
              meta={person[metaKey]}
            />
          ))}
        </div>
      ) : (
        <p className="mt-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
    </div>
  )
}

function PersonMiniCard({
  person,
  meta,
}: {
  person: TmdbEpisodePerson
  meta?: string
}) {
  const profileUrl = getProfileUrl(person.profile_path)

  return (
    <Link
      to="/person/$personId"
      params={{ personId: String(person.id) }}
      className="group w-36 shrink-0 rounded-lg border bg-background p-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      {profileUrl ? (
        <img
          src={profileUrl}
          alt={person.name}
          className="aspect-square w-full rounded-md object-cover transition duration-300 group-hover:brightness-105"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
          <UserRound className="h-6 w-6" />
        </div>
      )}
      <p className="mt-2 line-clamp-1 text-sm font-semibold">{person.name}</p>
      {meta && (
        <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
          {meta}
        </p>
      )}
    </Link>
  )
}
