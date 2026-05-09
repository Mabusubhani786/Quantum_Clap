import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clapperboard,
  Film,
  Play,
  Radio,
  Star,
} from "lucide-react"
import { useRouterState } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import { HeroVideoDialog } from "@/components/HeroVideoDialog"
import { WatchListButton } from "@/components/WatchListButton"
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
import { fetchApiData } from "@/service/fetchApiData"
import { cn } from "@/lib/utils"

type EndpointConfig = {
  method: "GET"
  api: string
}

type ApiEndpoints = {
  trending: {
    all_week: EndpointConfig
  }
  movies: {
    popular: EndpointConfig
    details: EndpointConfig
    videos: EndpointConfig
  }
  tv: {
    popular: EndpointConfig
    details: EndpointConfig
    videos: EndpointConfig
  }
  discover: {
    tv: EndpointConfig
  }
  genres: {
    movie: EndpointConfig
    tv: EndpointConfig
  }
}

type MediaType = "movie" | "tv"

type TmdbMediaItem = {
  id: number
  title?: string
  name?: string
  overview: string
  backdrop_path: string | null
  poster_path: string | null
  media_type?: MediaType
  genre_ids?: number[]
  genres?: TmdbGenre[]
  videos?: TmdbListResponse<TmdbVideo>
  vote_average: number
  release_date?: string
  first_air_date?: string
  status?: string
  number_of_seasons?: number
  number_of_episodes?: number
  last_episode_to_air?: TmdbEpisodeSummary | null
  next_episode_to_air?: TmdbEpisodeSummary | null
}

type TmdbEpisodeSummary = {
  id: number
  name: string
  air_date?: string | null
  episode_number: number
  season_number: number
}

type TmdbVideo = {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

type TmdbListResponse<TItem> = {
  page?: number
  total_pages?: number
  results: TItem[]
}

type TmdbGenre = {
  id: number
  name: string
}

type TmdbGenreResponse = {
  genres: TmdbGenre[]
}

type GenreMaps = {
  movie: Map<number, string>
  tv: Map<number, string>
}

type HeroMedia = {
  item: TmdbMediaItem
  mediaType: MediaType
  video?: TmdbVideo
}

type HeroSource = {
  endpoint: EndpointConfig
  label: string
  mediaType?: MediaType
  detailId?: string
  params?: Record<string, string | number | boolean>
}

const endpoints = apiEndPoints as ApiEndpoints
const heroPreviewDuration = 24000
const heroItemsPerPage = 5
const heroVideoLookupLimit = 14
const heroSourcePage = 2
const listingRoutePrefixes = ["/movie", "/series", "/anime"] as const
const animeHeroParams = {
  sort_by: "popularity.desc",
  with_genres: 16,
  with_origin_country: "JP",
}

function getTitle(item: TmdbMediaItem) {
  return item.title ?? item.name ?? "Untitled"
}

function getMediaType(item: TmdbMediaItem, fallback?: MediaType) {
  return item.media_type ?? fallback ?? (item.title ? "movie" : "tv")
}

function getReleaseYear(item: TmdbMediaItem) {
  const date = item.release_date ?? item.first_air_date

  if (!date) {
    return "TBA"
  }

  return new Date(date).getFullYear().toString()
}

function getVideosEndpoint(media: TmdbMediaItem, mediaType = getMediaType(media)) {
  const endpoint =
    mediaType === "movie" ? endpoints.movies.videos : endpoints.tv.videos

  return endpoint.api
    .replace("{movie_id}", String(media.id))
    .replace("{series_id}", String(media.id))
}

function getBestVideo(videos: TmdbVideo[]) {
  return (
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        video.official &&
        video.type.toLowerCase() === "trailer"
    ) ??
    videos.find(
      (video) => video.site === "YouTube" && video.type.toLowerCase() === "trailer"
    ) ??
    videos.find((video) => video.site === "YouTube")
  )
}

function shuffleItems<TItem>(items: TItem[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function formatRating(rating: number) {
  return rating > 0 ? rating.toFixed(1) : "NR"
}

function formatAirDate(value?: string | null) {
  if (!value) {
    return "TBA"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "TBA"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getEpisodeLabel(episode?: TmdbEpisodeSummary | null) {
  if (!episode) {
    return "TBA"
  }

  return `S${episode.season_number} E${episode.episode_number}`
}

function createGenreMap(genres: TmdbGenre[]) {
  return new Map(genres.map((genre) => [genre.id, genre.name]))
}

function getGenreNames(
  item: TmdbMediaItem | undefined,
  mediaType: MediaType | undefined,
  genreMaps: GenreMaps
) {
  if (!item?.genre_ids?.length || !mediaType) {
    return item?.genres?.map((genre) => genre.name).slice(0, 4) ?? []
  }

  return item.genre_ids
    .map((genreId) => genreMaps[mediaType].get(genreId))
    .filter((genre): genre is string => Boolean(genre))
    .slice(0, 4)
}

function getYouTubeEmbedUrl(videoKey: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  })

  return `https://www.youtube.com/embed/${videoKey}?${params.toString()}`
}

function getYouTubeDialogUrl(videoKey: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    controls: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  })

  return `https://www.youtube.com/embed/${videoKey}?${params.toString()}`
}

function HeroFeatureSkeleton() {
  return (
    <div className="max-w-3xl space-y-5">
      <Skeleton className="h-7 w-40 bg-white/12" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-4/5 bg-white/12 sm:h-16" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-full max-w-2xl bg-white/12" />
          <Skeleton className="h-5 w-11/12 max-w-2xl bg-white/12" />
          <Skeleton className="h-5 w-2/3 max-w-2xl bg-white/12" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 bg-white/12" />
        <Skeleton className="h-6 w-14 bg-white/12" />
        <Skeleton className="h-6 w-16 bg-white/12" />
        <Skeleton className="h-6 w-24 bg-white/12" />
      </div>
      <Skeleton className="h-10 w-32 bg-white/16" />
    </div>
  )
}

function HeroQueueCardSkeleton({ isActive }: { isActive: boolean }) {
  return (
    <Card
      className={cn(
        "h-44 rounded-lg border-white/10 bg-white/[0.07] py-0 text-white shadow-lg shadow-black/10",
        isActive && "border-white/45 bg-white/[0.16] shadow-black/25"
      )}
    >
      <CardHeader className="gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-4/5 bg-white/12" />
            <Skeleton className="h-4 w-full bg-white/12" />
            <Skeleton className="h-4 w-2/3 bg-white/12" />
          </div>
          <Skeleton className="h-6 w-14 shrink-0 bg-white/16" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 bg-white/12" />
          <Skeleton className="h-6 w-14 bg-white/12" />
          <Skeleton className="h-6 w-16 bg-white/12" />
          <Skeleton className="h-6 w-20 bg-white/12" />
        </div>
      </CardContent>
    </Card>
  )
}

function getHeroSource(pathname: string): HeroSource {
  const [, route, detailId] = pathname.split("/")

  if (route === "movie" && detailId) {
    return {
      endpoint: endpoints.movies.details,
      label: "selected movie",
      mediaType: "movie",
      detailId,
      params: {
        append_to_response: "videos,credits,images,watch/providers",
      },
    }
  }

  if (route === "series" && detailId) {
    return {
      endpoint: endpoints.tv.details,
      label: "selected series",
      mediaType: "tv",
      detailId,
      params: {
        append_to_response: "videos,credits,images,watch/providers",
      },
    }
  }

  if (route === "anime" && detailId) {
    return {
      endpoint: endpoints.tv.details,
      label: "selected anime",
      mediaType: "tv",
      detailId,
      params: {
        append_to_response: "videos,credits,images,watch/providers",
      },
    }
  }

  if (pathname.startsWith("/movie")) {
    return {
      endpoint: endpoints.movies.popular,
      label: "popular movies",
      mediaType: "movie",
    }
  }

  if (pathname.startsWith("/series")) {
    return {
      endpoint: endpoints.tv.popular,
      label: "popular series",
      mediaType: "tv",
    }
  }

  if (pathname.startsWith("/anime")) {
    return {
      endpoint: endpoints.discover.tv,
      label: "anime series",
      mediaType: "tv",
      params: animeHeroParams,
    }
  }

  return {
    endpoint: endpoints.trending.all_week,
    label: "trending titles",
  }
}

export function HeroSection() {
  const location = useRouterState({
    select: (state) => state.location,
  })
  const pathname = location.pathname
  const routeRefreshKey = location.href
  const isEntityDetailRoute =
    pathname.startsWith("/person") ||
    pathname.startsWith("/company") ||
    pathname.endsWith("/overview")
  const heroSource = useMemo(() => getHeroSource(pathname), [pathname])
  const [heroItems, setHeroItems] = useState<HeroMedia[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [isLoading, setIsLoading] = useState(true)
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [catalogPageByRoute, setCatalogPageByRoute] = useState<
    Partial<Record<(typeof listingRoutePrefixes)[number], number>>
  >({})
  const [genreMaps, setGenreMaps] = useState<GenreMaps>({
    movie: new Map(),
    tv: new Map(),
  })

  const listingRouteKey = useMemo(() => {
    return (
      listingRoutePrefixes.find((routePrefix) =>
        pathname.startsWith(routePrefix)
      ) ?? null
    )
  }, [pathname])

  const sourcePage = listingRouteKey
    ? Math.max(1, catalogPageByRoute[listingRouteKey] ?? 1)
    : heroSourcePage

  const activeHero = heroItems[activeIndex]
  const activeItem = activeHero?.item
  const activeMediaType = activeHero?.mediaType
  const activeVideo = activeHero?.video
  const activeGenres = getGenreNames(activeItem, activeMediaType, genreMaps)
  const previewItems: Array<HeroMedia | null> = isLoading
    ? Array.from({ length: 10 }, () => null)
    : heroItems

  const loadHeroPage = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setHeroItems([])
      setActiveIndex(0)

      if (isEntityDetailRoute) {
        setHeroItems([])
        setIsLoading(false)
        return
      }

      if (heroSource.detailId) {
        const detail = await fetchApiData<TmdbMediaItem>({
          endpoint: heroSource.endpoint.api
            .replace("{movie_id}", heroSource.detailId)
            .replace("{series_id}", heroSource.detailId),
          method: heroSource.endpoint.method,
          params: {
            language: "en-US",
            ...heroSource.params,
          },
          signal,
        })

        if (signal?.aborted) {
          return
        }

        const mediaType = heroSource.mediaType ?? "movie"
        const embeddedVideos = detail?.videos?.results ?? []
        const videos = embeddedVideos.length > 0
          ? null
          : await fetchApiData<TmdbListResponse<TmdbVideo>>({
              endpoint: getVideosEndpoint(
                detail ?? ({ id: Number(heroSource.detailId) } as TmdbMediaItem),
                mediaType
              ),
              method: "GET",
              params: {
                language: "en-US",
              },
              signal,
            })

        if (signal?.aborted) {
          return
        }

        if (detail) {
          const videoResults = (
            embeddedVideos.length > 0 ? embeddedVideos : (videos?.results ?? [])
          ).filter((video) => video.site === "YouTube")
          const detailHeroItems =
            videoResults.length > 0
              ? videoResults.map((video) => ({
                  item: detail,
                  mediaType,
                  video,
                }))
              : [
                  {
                    item: detail,
                    mediaType,
                  },
                ]

          setHeroItems(detailHeroItems)
        } else {
          setHeroItems([])
        }

        setIsLoading(false)
        setActiveIndex(0)
        return
      }

      const response = await fetchApiData<TmdbListResponse<TmdbMediaItem>>({
        endpoint: heroSource.endpoint.api,
        method: heroSource.endpoint.method,
        params: {
          language: "en-US",
          page: sourcePage,
          ...heroSource.params,
        },
        signal,
      })

      if (signal?.aborted) {
        return
      }

      const randomItems = shuffleItems(
        response?.results.filter((item) => {
          const mediaType = getMediaType(item, heroSource.mediaType)

          return mediaType === "movie" || mediaType === "tv"
        }) ?? []
      ).slice(0, heroVideoLookupLimit)

      const mediaWithVideos = await Promise.all(
        randomItems.map(async (item) => {
          const mediaType = getMediaType(item, heroSource.mediaType)
          const videos = await fetchApiData<TmdbListResponse<TmdbVideo>>({
            endpoint: getVideosEndpoint(item, mediaType),
            method: "GET",
            params: {
              language: "en-US",
            },
            signal,
          })

          return {
            item,
            mediaType,
            video: getBestVideo(videos?.results ?? []),
          }
        })
      )

      if (signal?.aborted) {
        return
      }

      const randomVideoItems = shuffleItems(
        mediaWithVideos.filter((hero) => Boolean(hero.video))
      ).slice(0, heroItemsPerPage)
      const fallbackItems = shuffleItems(mediaWithVideos).slice(0, heroItemsPerPage)

      setHeroItems(randomVideoItems.length > 0 ? randomVideoItems : fallbackItems)
      setIsLoading(false)
      setActiveIndex(0)
    },
    [heroSource, isEntityDetailRoute, routeRefreshKey, sourcePage]
  )

  useEffect(() => {
    function handleCatalogPageChange(event: Event) {
      const customEvent = event as CustomEvent<{
        route?: string
        page?: number
      }>
      const nextRoute = customEvent.detail?.route
      const nextPage = customEvent.detail?.page

      if (
        !nextRoute ||
        typeof nextPage !== "number" ||
        !listingRoutePrefixes.includes(
          nextRoute as (typeof listingRoutePrefixes)[number]
        )
      ) {
        return
      }

      setCatalogPageByRoute((current) => {
        const routeKey = nextRoute as (typeof listingRoutePrefixes)[number]
        if (current[routeKey] === nextPage) {
          return current
        }

        return {
          ...current,
          [routeKey]: nextPage,
        }
      })
    }

    window.addEventListener("catalog-page-change", handleCatalogPageChange)

    return () =>
      window.removeEventListener("catalog-page-change", handleCatalogPageChange)
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    async function loadHeroMedia() {
      const [movieGenres, tvGenres] = await Promise.all([
        fetchApiData<TmdbGenreResponse>({
          endpoint: endpoints.genres.movie.api,
          method: endpoints.genres.movie.method,
          params: {
            language: "en-US",
          },
          signal: abortController.signal,
        }),
        fetchApiData<TmdbGenreResponse>({
          endpoint: endpoints.genres.tv.api,
          method: endpoints.genres.tv.method,
          params: {
            language: "en-US",
          },
          signal: abortController.signal,
        }),
      ])

      if (abortController.signal.aborted) {
        return
      }

      setGenreMaps({
        movie: createGenreMap(movieGenres?.genres ?? []),
        tv: createGenreMap(tvGenres?.genres ?? []),
      })

      await loadHeroPage(abortController.signal)
    }

    loadHeroMedia()

    return () => abortController.abort()
  }, [loadHeroPage])

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const handleSelect = () => {
      const selectedIndex = carouselApi.selectedScrollSnap()

      setActiveIndex(selectedIndex)
    }

    handleSelect()
    carouselApi.on("select", handleSelect)
    carouselApi.on("reInit", handleSelect)

    return () => {
      carouselApi.off("select", handleSelect)
      carouselApi.off("reInit", handleSelect)
    }
  }, [carouselApi, heroItems.length])

  useEffect(() => {
    if (!carouselApi || heroItems.length <= 1) {
      return
    }

    const timer = window.setTimeout(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext()
        return
      }

      carouselApi.scrollTo(0)
    }, heroPreviewDuration)

    return () => window.clearTimeout(timer)
  }, [activeIndex, carouselApi, activeVideo?.key, heroItems.length])

  if (isEntityDetailRoute) {
    return null
  }

  return (
    <section className="relative isolate overflow-hidden bg-[#050505] text-white">
      <div className="relative min-h-[clamp(40rem,82vh,56rem)] sm:min-h-[clamp(36rem,76vh,54rem)]">
        {activeVideo && (
          <iframe
            key={activeVideo.key}
            title={activeVideo.name}
            src={getYouTubeEmbedUrl(activeVideo.key)}
            className="pointer-events-none absolute top-1/2 left-1/2 -z-20 aspect-video h-[120%] min-h-full w-[260%] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 opacity-55 sm:w-[180%] lg:w-[150%]"
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 -z-10 bg-black/18" />

        <div className="mx-auto flex min-h-[clamp(40rem,82vh,56rem)] w-full items-end px-3 pb-8 sm:min-h-[clamp(36rem,76vh,54rem)] sm:px-4 lg:pb-12">
          <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-end xl:gap-8">
            {!activeItem ? (
              <HeroFeatureSkeleton />
            ) : (
              <div className="max-w-3xl space-y-5">
                <Badge className="gap-2 rounded-md border-white/12 bg-white/[0.1] px-3 py-1 text-sm font-medium text-white shadow-inner hover:bg-white/[0.1]">
                  <Play className="h-4 w-4 fill-current" />
                  {activeVideo ? "Now playing trailer" : "Featured preview"}
                </Badge>

                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl leading-tight font-bold sm:text-5xl lg:text-6xl">
                    {getTitle(activeItem)}
                  </h1>
                  <p className="line-clamp-3 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                    {activeItem.overview || "No description available yet."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1 rounded-md">
                    {activeMediaType === "tv" ? (
                      <Clapperboard className="h-3.5 w-3.5" />
                    ) : (
                      <Film className="h-3.5 w-3.5" />
                    )}
                    {activeMediaType === "tv" ? "Series" : "Movie"}
                  </Badge>
                  <Badge variant="secondary" className="gap-1 rounded-md">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {formatRating(activeItem.vote_average)}
                  </Badge>
                  <Badge variant="secondary" className="gap-1 rounded-md">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {getReleaseYear(activeItem)}
                  </Badge>
                  {activeGenres.map((genre) => (
                    <Badge
                      key={genre}
                      className="rounded-md bg-white/12 text-white hover:bg-white/12"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>

                {activeMediaType === "tv" && (
                  <div className="grid max-w-3xl gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <HeroAirInfo
                      label="First aired"
                      value={formatAirDate(activeItem.first_air_date)}
                      detail={activeItem.status || "Status TBA"}
                    />
                    <HeroAirInfo
                      label="Last episode"
                      value={getEpisodeLabel(activeItem.last_episode_to_air)}
                      detail={
                        activeItem.last_episode_to_air
                          ? formatAirDate(activeItem.last_episode_to_air.air_date)
                          : "No episode yet"
                      }
                    />
                    <HeroAirInfo
                      label="Next episode"
                      value={getEpisodeLabel(activeItem.next_episode_to_air)}
                      detail={
                        activeItem.next_episode_to_air
                          ? formatAirDate(activeItem.next_episode_to_air.air_date)
                          : "Not scheduled"
                      }
                    />
                    <HeroAirInfo
                      label="Series size"
                      value={`${activeItem.number_of_seasons ?? 0} seasons`}
                      detail={`${activeItem.number_of_episodes ?? 0} episodes`}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    className="h-10 rounded-md bg-white px-4 text-sm font-semibold text-black hover:bg-white/90"
                    disabled={!activeVideo}
                    onClick={() => setIsVideoDialogOpen(true)}
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Play preview
                  </Button>
                  <WatchListButton
                    className="size-10 rounded-md"
                    item={{
                      media_id: activeItem.id,
                      media_type: activeMediaType,
                      title: getTitle(activeItem),
                      overview: activeItem.overview,
                      poster_url: activeItem.poster_path
                        ? `https://image.tmdb.org/t/p/w500${activeItem.poster_path}`
                        : undefined,
                      background_image_url: activeItem.backdrop_path
                        ? `https://image.tmdb.org/t/p/original${activeItem.backdrop_path}`
                        : undefined,
                      metadata: {
                        rating: activeItem.vote_average,
                        release_year: getReleaseYear(activeItem),
                        genres: activeGenres,
                      },
                    }}
                  />
                </div>
              </div>
            )}

            <div className="min-w-0">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white/86">
                    Trailer Queue
                  </p>
                  <p className="text-xs text-white/56">
                    Random trailers from page {sourcePage} in {heroSource.label}
                  </p>
                </div>
                <Badge className="rounded-md bg-white/12 text-white hover:bg-white/12">
                  {heroSource.detailId ? `${heroItems.length || 1} videos` : "5 videos"}
                </Badge>
              </div>
              <Carousel
                setApi={setCarouselApi}
                opts={{ align: "start", loop: true }}
                className="relative"
              >
                <CarouselContent className="-ml-3">
                  {previewItems.map((hero, index) => {
                    const item = hero?.item ?? null
                    const mediaType = item ? getMediaType(item) : "movie"
                    const isActive = index === activeIndex
                    const genres = getGenreNames(item ?? undefined, mediaType, genreMaps)

                    return (
                      <CarouselItem
                        key={`${item?.id ?? "skeleton"}-${hero?.video?.id ?? index}`}
                        className="basis-[86%] pl-3 sm:basis-[58%] lg:basis-[86%] xl:basis-[78%]"
                      >
                        {!item ? (
                          <HeroQueueCardSkeleton isActive={isActive} />
                        ) : (
                          <Card
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "h-44 cursor-pointer rounded-lg border-white/10 bg-white/[0.07] py-0 text-white shadow-lg shadow-black/10 transition hover:bg-white/[0.12]",
                              isActive &&
                                "border-white/45 bg-white/[0.16] shadow-black/25"
                            )}
                            onClick={() => {
                              carouselApi?.scrollTo(index)
                              setActiveIndex(index)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                carouselApi?.scrollTo(index)
                                setActiveIndex(index)
                              }
                            }}
                          >
                            <CardHeader className="gap-2 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-2">
                                  <CardTitle className="line-clamp-2 text-base leading-snug">
                                    {hero?.video?.name ?? getTitle(item)}
                                  </CardTitle>
                                  <CardDescription className="line-clamp-2 text-xs leading-5 text-white/58">
                                    {hero?.video?.type ||
                                      item.overview ||
                                      "No description available yet."}
                                  </CardDescription>
                                </div>
                                <Badge
                                  className={cn(
                                    "shrink-0 rounded-md text-xs",
                                    hero?.video
                                      ? "bg-white text-black hover:bg-white"
                                      : "bg-white/12 text-white hover:bg-white/12"
                                  )}
                                >
                                  {hero?.video ? "Video" : "No video"}
                                </Badge>
                                <div className="z-20 shrink-0">
                                  <WatchListButton
                                    className="size-8"
                                    item={{
                                      media_id: item.id,
                                      media_type: mediaType,
                                      title: getTitle(item),
                                      overview: item.overview,
                                      poster_url: item.poster_path
                                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                        : undefined,
                                      background_image_url: item.backdrop_path
                                        ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                                        : undefined,
                                      metadata: {
                                        rating: item.vote_average,
                                        release_year: getReleaseYear(item),
                                        genres,
                                      },
                                    }}
                                  />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant="secondary"
                                  className="gap-1 rounded-md text-xs"
                                >
                                  {mediaType === "tv" ? (
                                    <Clapperboard className="h-3 w-3" />
                                  ) : (
                                    <Film className="h-3 w-3" />
                                  )}
                                  {mediaType === "tv" ? "Series" : "Movie"}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="gap-1 rounded-md text-xs"
                                >
                                  <Star className="h-3 w-3 fill-current" />
                                  {formatRating(item.vote_average)}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="gap-1 rounded-md text-xs"
                                >
                                  <CalendarDays className="h-3 w-3" />
                                  {getReleaseYear(item)}
                                </Badge>
                                {genres.slice(0, 2).map((genre) => (
                                  <Badge
                                    key={genre}
                                    className="rounded-md bg-white/12 text-xs text-white hover:bg-white/12"
                                  >
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
                <div className="mt-3 flex justify-end gap-2">
                  <CarouselPrevious className="static translate-0 rounded-md border-white/12 bg-white/10 text-white hover:bg-white/16 hover:text-white disabled:opacity-35" />
                  <CarouselNext className="static translate-0 rounded-md border-white/12 bg-white/10 text-white hover:bg-white/16 hover:text-white disabled:opacity-35" />
                </div>
              </Carousel>
            </div>
          </div>
	        </div>
	      </div>
	      <HeroVideoDialog
	        open={isVideoDialogOpen}
	        title={activeItem ? getTitle(activeItem) : "Preview"}
	        description={activeVideo?.name}
	        videoUrl={
	          activeVideo ? getYouTubeDialogUrl(activeVideo.key) : undefined
	        }
	        onOpenChange={setIsVideoDialogOpen}
	      />
	    </section>
	  )
	}

function HeroAirInfo({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/24 p-3 shadow-lg shadow-black/10 backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-2 text-[0.7rem] font-medium uppercase text-white/54">
        <Radio className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="line-clamp-1 text-sm font-semibold text-white">{value}</p>
      <p className="line-clamp-1 text-xs text-white/62">{detail}</p>
    </div>
  )
}
