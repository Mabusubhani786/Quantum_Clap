import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarDays,
  Clapperboard,
  Film,
  Flame,
  Radio,
  Star,
  Trophy,
} from "lucide-react"
import { Link, createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import { EmptyState } from "@/components/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { UserMediaSections } from "@/components/UserMediaSections"
import TiltedCard from "@/components/TiltedCard"
import { ThinkingOrb } from "thinking-orbs"
import { WatchListButton } from "@/components/WatchListButton"
import { fetchApiData } from "@/service/fetchApiData"

export const Route = createFileRoute("/__mainLayout/home")({
  component: RouteComponent,
})

type EndpointConfig = {
  method: "GET"
  api: string
}

type ApiEndpoints = {
  trending: {
    all_day: EndpointConfig
    all_week: EndpointConfig
    movies_day: EndpointConfig
    movies_week: EndpointConfig
    tv_day: EndpointConfig
    tv_week: EndpointConfig
  }
  movies: {
    upcoming: EndpointConfig
    top_rated: EndpointConfig
  }
  tv: {
    on_the_air: EndpointConfig
  }
}

type MediaType = "movie" | "tv"
type TrendingMediaFilter = "all" | "movie" | "tv"
type TrendingWindowFilter = "day" | "week"

type TmdbMediaItem = {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  media_type?: MediaType
  vote_average: number
  release_date?: string
  first_air_date?: string
}

type TmdbListResponse = {
  page: number
  total_pages: number
  results: TmdbMediaItem[]
}

type HomeSection = {
  id: string
  title: string
  description: string
  endpoint: EndpointConfig
  mediaType?: MediaType
  badge: string
  icon: typeof Flame
  viewAllTo: "/movie" | "/series"
}

type SectionState = {
  items: TmdbMediaItem[]
  page: number
  loading: boolean
  loadingMore: boolean
  error: boolean
  hasMore: boolean
}

const endpoints = apiEndPoints as ApiEndpoints
const imageBaseUrl = "https://image.tmdb.org/t/p/w500"
const fallbackImage =
  "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg"

const emptySectionState: SectionState = {
  items: [],
  page: 0,
  loading: true,
  loadingMore: false,
  error: false,
  hasMore: true,
}

function getTrendingEndpoint(
  mediaFilter: TrendingMediaFilter,
  windowFilter: TrendingWindowFilter
) {
  if (mediaFilter === "movie") {
    return windowFilter === "day"
      ? endpoints.trending.movies_day
      : endpoints.trending.movies_week
  }

  if (mediaFilter === "tv") {
    return windowFilter === "day"
      ? endpoints.trending.tv_day
      : endpoints.trending.tv_week
  }

  return windowFilter === "day"
    ? endpoints.trending.all_day
    : endpoints.trending.all_week
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

function getPosterUrl(item: TmdbMediaItem) {
  return item.poster_path ? `${imageBaseUrl}${item.poster_path}` : fallbackImage
}

function formatRating(rating: number) {
  return rating > 0 ? rating.toFixed(1) : "NR"
}

function mergeUniqueItems(
  currentItems: TmdbMediaItem[],
  nextItems: TmdbMediaItem[]
) {
  const seenItems = new Set(currentItems.map((item) => item.id))
  const uniqueNextItems = nextItems.filter((item) => {
    if (seenItems.has(item.id)) {
      return false
    }

    seenItems.add(item.id)
    return true
  })

  return [...currentItems, ...uniqueNextItems]
}

function MediaCard({
  item,
  mediaType,
  rank,
}: {
  item: TmdbMediaItem
  mediaType?: MediaType
  rank: number
}) {
  const resolvedMediaType = getMediaType(item, mediaType)
  const MediaIcon = resolvedMediaType === "movie" ? Film : Clapperboard
  const detailTo = `/${resolvedMediaType === "movie" ? "movie" : "series"}/${item.id}`

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="group/card relative block h-full">
          <Link
            aria-label={`Open ${getTitle(item)}`}
            to={detailTo}
            className="absolute inset-0 z-10 rounded-lg"
          />
          <div className="absolute top-2 right-2 z-30">
            <WatchListButton
              item={{
                media_id: item.id,
                media_type: resolvedMediaType,
                title: getTitle(item),
                overview: item.overview,
                poster_url: getPosterUrl(item),
                background_image_url: item.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                  : undefined,
                metadata: {
                  rank,
                  rating: item.vote_average,
                  release_year: getReleaseYear(item),
                },
              }}
            />
          </div>
          <Card className="h-full rounded-lg py-0 transition duration-300 group-hover/card:-translate-y-0.5 group-hover/card:shadow-xl">
            <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg bg-muted">
              <TiltedCard
                imageSrc={getPosterUrl(item)}
                altText={`${getTitle(item)} poster`}
                containerHeight="100%"
                containerWidth="100%"
                imageHeight="100%"
                imageWidth="100%"
                scaleOnHover={1.05}
                rotateAmplitude={10}
                showMobileWarning={false}
                showTooltip={false}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-2 text-white">
                <Badge className="rounded-md bg-white px-1.5 py-0.5 text-[10px] text-black hover:bg-white">
                  #{rank}
                </Badge>
              </div>
            </div>

            <CardHeader className="gap-1 pb-2">
              <CardTitle className="line-clamp-1 text-sm leading-tight sm:text-[0.95rem]">
                {getTitle(item)}
              </CardTitle>
              <CardDescription className="line-clamp-2 min-h-6 text-[10px] leading-relaxed">
                {item.overview || "No description available yet."}
              </CardDescription>
              <CardAction>
                <Badge variant="secondary" className="gap-1 rounded-md px-1.5 py-0.5 text-[10px]">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  {formatRating(item.vote_average)}
                </Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="pb-2">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="gap-1 rounded-md px-1.5 py-0.5 text-[10px]">
                  <MediaIcon className="h-2.5 w-2.5" />
                  {resolvedMediaType === "movie" ? "Movie" : "Series"}
                </Badge>
                <Badge variant="secondary" className="gap-1 rounded-md px-1.5 py-0.5 text-[10px]">
                  <CalendarDays className="h-2.5 w-2.5" />
                  {getReleaseYear(item)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-80 overflow-hidden rounded-xl border-white/10 bg-black/95 p-0 text-white shadow-2xl backdrop-blur-xl"
      >
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={getPosterUrl(item)}
            alt={getTitle(item)}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-sm font-semibold leading-tight">
              {getTitle(item)}
            </p>
          </div>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 rounded-md px-1.5 py-0.5 text-[10px]">
              <Star className="h-2.5 w-2.5 fill-current" />
              {formatRating(item.vote_average)}
            </Badge>
            <Badge variant="secondary" className="gap-1 rounded-md px-1.5 py-0.5 text-[10px]">
              <MediaIcon className="h-2.5 w-2.5" />
              {resolvedMediaType === "movie" ? "Movie" : "Series"}
            </Badge>
            <Badge variant="secondary" className="gap-1 rounded-md px-1.5 py-0.5 text-[10px]">
              <CalendarDays className="h-2.5 w-2.5" />
              {getReleaseYear(item)}
            </Badge>
          </div>
          <p className="line-clamp-3 text-xs leading-5 text-white/62">
            {item.overview || "No description available yet."}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function LoadingCarousel() {
  return (
    <div className="flex items-center justify-center py-16">
      <ThinkingOrb state="searching" size={64} />
    </div>
  )
}

function LoadingMoreCard() {
  return (
    <Card className="h-full min-h-[18rem] overflow-hidden rounded-lg py-0">
      <div className="flex aspect-[2/3] w-full items-center justify-center rounded-t-lg bg-muted">
        <ThinkingOrb state="working" size={20} />
      </div>
      <CardHeader className="gap-1 pb-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-2/3" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex gap-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}

function SectionCarousel({
  section,
  state,
  onLoadMore,
}: {
  section: HomeSection
  state: SectionState
  onLoadMore: (section: HomeSection) => void
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const carouselRootRef = useRef<HTMLDivElement>(null)
  const wheelDeltaRef = useRef(0)

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const handleSelect = () => {
      if (!carouselApi.canScrollNext()) {
        onLoadMore(section)
      }
    }

    carouselApi.on("select", handleSelect)
    carouselApi.on("settle", handleSelect)

    return () => {
      carouselApi.off("select", handleSelect)
      carouselApi.off("settle", handleSelect)
    }
  }, [carouselApi, onLoadMore, section])

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!carouselApi || event.ctrlKey) {
        return
      }

      const wheelDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY

      if (Math.abs(wheelDelta) < 8) {
        return
      }

      event.preventDefault()
      wheelDeltaRef.current += wheelDelta

      if (Math.abs(wheelDeltaRef.current) < 80) {
        return
      }

      if (wheelDeltaRef.current > 0) {
        if (carouselApi.canScrollNext()) {
          carouselApi.scrollNext()
        } else {
          onLoadMore(section)
        }
      } else if (carouselApi.canScrollPrev()) {
        carouselApi.scrollPrev()
      }

      wheelDeltaRef.current = 0
    },
    [carouselApi, onLoadMore, section]
  )

  useEffect(() => {
    const carouselRoot = carouselRootRef.current

    if (!carouselRoot) {
      return
    }

    carouselRoot.addEventListener("wheel", handleWheel, { passive: false })

    return () => carouselRoot.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  return (
    <div ref={carouselRootRef}>
      <Carousel
        setApi={setCarouselApi}
        opts={{ align: "start", dragFree: true }}
        className="relative"
      >
        <CarouselContent className="-ml-4">
          {state.items.map((item, index) => (
            <CarouselItem
              key={`${section.id}-${item.id}`}
              className="basis-[46%] pl-3 min-[420px]:basis-[32%] sm:basis-[24%] md:basis-[17.5%] lg:basis-[12.5%] 2xl:basis-[9.5%]"
            >
              <MediaCard
                item={item}
                mediaType={section.mediaType}
                rank={index + 1}
              />
            </CarouselItem>
          ))}

          {state.loadingMore && (
            <CarouselItem className="basis-[46%] pl-3 min-[420px]:basis-[32%] sm:basis-[24%] md:basis-[17.5%] lg:basis-[12.5%] 2xl:basis-[9.5%]">
              <LoadingMoreCard />
            </CarouselItem>
          )}
        </CarouselContent>

        <div className="mt-4 flex justify-end gap-2">
          <CarouselPrevious className="static translate-0 rounded-md" />
          <CarouselNext className="static translate-0 rounded-md" />
        </div>
      </Carousel>
    </div>
  )
}

function TrendingFilters({
  mediaFilter,
  windowFilter,
  onMediaFilterChange,
  onWindowFilterChange,
}: {
  mediaFilter: TrendingMediaFilter
  windowFilter: TrendingWindowFilter
  onMediaFilterChange: (value: TrendingMediaFilter) => void
  onWindowFilterChange: (value: TrendingWindowFilter) => void
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <Select value={mediaFilter} onValueChange={onMediaFilterChange}>
        <SelectTrigger className="h-9 w-full rounded-md bg-background sm:w-36">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="movie">Movies</SelectItem>
          <SelectItem value="tv">Series</SelectItem>
        </SelectContent>
      </Select>

      <Select value={windowFilter} onValueChange={onWindowFilterChange}>
        <SelectTrigger className="h-9 w-full rounded-md bg-background sm:w-32">
          <SelectValue placeholder="Week" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Today</SelectItem>
          <SelectItem value="week">Week</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function MediaSection({
  section,
  state,
  onLoadMore,
  trendingFilters,
}: {
  section: HomeSection
  state: SectionState
  onLoadMore: (section: HomeSection) => void
  trendingFilters?: React.ReactNode
}) {
  const Icon = section.icon

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <Badge variant="secondary" className="gap-2 rounded-md px-3 py-1">
            <Icon className="h-4 w-4" />
            {section.badge}
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {section.title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {section.description}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          {trendingFilters}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to={section.viewAllTo}>View all</Link>
          </Button>
        </div>
      </div>

      {state.loading ? (
        <LoadingCarousel />
      ) : state.error || state.items.length === 0 ? (
        <EmptyState
          title="No data is available"
          description={
            state.error
              ? "This section could not be loaded from TMDB right now."
              : "This section does not have any titles to show yet."
          }
        />
      ) : (
        <SectionCarousel
          section={section}
          state={state}
          onLoadMore={onLoadMore}
        />
      )}
    </section>
  )
}

function RouteComponent() {
  const [trendingMediaFilter, setTrendingMediaFilter] =
    useState<TrendingMediaFilter>("all")
  const [trendingWindowFilter, setTrendingWindowFilter] =
    useState<TrendingWindowFilter>("week")
  const [sectionsState, setSectionsState] = useState<
    Record<string, SectionState>
  >({
    trending: emptySectionState,
    upcoming: emptySectionState,
    "on-the-air": emptySectionState,
    "top-rated": emptySectionState,
  })

  const trendingSection = useMemo<HomeSection>(
    () => ({
      id: "trending",
      title: "Trending Movies & Series",
      description: "The titles people are watching and talking about right now.",
      endpoint: getTrendingEndpoint(trendingMediaFilter, trendingWindowFilter),
      mediaType: trendingMediaFilter === "all" ? undefined : trendingMediaFilter,
      badge: trendingWindowFilter === "day" ? "Today" : "This week",
      icon: Flame,
      viewAllTo: trendingMediaFilter === "tv" ? "/series" : "/movie",
    }),
    [trendingMediaFilter, trendingWindowFilter]
  )

  const staticSections = useMemo<HomeSection[]>(
    () => [
      {
        id: "upcoming",
        title: "Upcoming Movies",
        description: "Fresh releases coming soon to theaters and watchlists.",
        endpoint: endpoints.movies.upcoming,
        mediaType: "movie",
        badge: "Coming soon",
        icon: CalendarDays,
        viewAllTo: "/movie",
      },
      {
        id: "on-the-air",
        title: "On The Air Series",
        description: "Series currently airing, updated with active TV picks.",
        endpoint: endpoints.tv.on_the_air,
        mediaType: "tv",
        badge: "Live seasons",
        icon: Radio,
        viewAllTo: "/series",
      },
      {
        id: "top-rated",
        title: "Top Rated Movies",
        description: "Highly rated movie picks with strong audience scores.",
        endpoint: endpoints.movies.top_rated,
        mediaType: "movie",
        badge: "Best rated",
        icon: Trophy,
        viewAllTo: "/movie",
      },
    ],
    []
  )

  const homeSections = useMemo<HomeSection[]>(
    () => [trendingSection, ...staticSections],
    [staticSections, trendingSection]
  )

  const loadSectionPage = useCallback(
    async (section: HomeSection, page: number, mode: "replace" | "append") => {
      setSectionsState((current) => ({
        ...current,
        [section.id]: {
          ...(current[section.id] ?? emptySectionState),
          loading: mode === "replace",
          loadingMore: mode === "append",
          error: false,
        },
      }))

      const response = await fetchApiData<TmdbListResponse>({
        endpoint: section.endpoint.api,
        method: section.endpoint.method,
        params: {
          language: "en-US",
          page,
        },
      })

      setSectionsState((current) => {
        const previousState = current[section.id] ?? emptySectionState

        return {
          ...current,
          [section.id]: {
            items: response
              ? mode === "append"
                ? mergeUniqueItems(previousState.items, response.results)
                : response.results
              : mode === "append"
                ? previousState.items
                : [],
            page: response?.page ?? previousState.page,
            loading: false,
            loadingMore: false,
            error: !response && mode === "replace",
            hasMore: response ? response.page < response.total_pages : false,
          },
        }
      })
    },
    []
  )

  const loadMoreSection = useCallback(
    (section: HomeSection) => {
      const state = sectionsState[section.id]

      if (!state || state.loading || state.loadingMore || !state.hasMore) {
        return
      }

      void loadSectionPage(section, state.page + 1, "append")
    },
    [loadSectionPage, sectionsState]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSectionPage(trendingSection, 1, "replace")
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadSectionPage, trendingSection])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      staticSections.forEach((section) => {
        void loadSectionPage(section, 1, "replace")
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadSectionPage, staticSections])

  return (
    <div className="mx-auto w-full space-y-10 py-8 sm:py-10">
      <UserMediaSections className="space-y-8" />

      {homeSections.map((section) => (
        <MediaSection
          key={section.id}
          section={section}
          state={sectionsState[section.id] ?? emptySectionState}
          onLoadMore={loadMoreSection}
          trendingFilters={
            section.id === "trending" ? (
              <TrendingFilters
                mediaFilter={trendingMediaFilter}
                windowFilter={trendingWindowFilter}
                onMediaFilterChange={setTrendingMediaFilter}
                onWindowFilterChange={setTrendingWindowFilter}
              />
            ) : undefined
          }
        />
      ))}
    </div>
  )
}
