import { useEffect, useState } from "react"
import { CalendarDays, Clapperboard, Film, Play, Star } from "lucide-react"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
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
    videos: EndpointConfig
  }
  tv: {
    videos: EndpointConfig
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
  vote_average: number
  release_date?: string
  first_air_date?: string
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

const endpoints = apiEndPoints as ApiEndpoints
const backdropBaseUrl = "https://image.tmdb.org/t/p/original"
const fallbackBackdrop =
  "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg"
const heroPreviewDuration = 24000

function getTitle(item: TmdbMediaItem) {
  return item.title ?? item.name ?? "Untitled"
}

function getMediaType(item: TmdbMediaItem) {
  return item.media_type ?? (item.title ? "movie" : "tv")
}

function getReleaseYear(item: TmdbMediaItem) {
  const date = item.release_date ?? item.first_air_date

  if (!date) {
    return "TBA"
  }

  return new Date(date).getFullYear().toString()
}

function getBackdropUrl(item: TmdbMediaItem) {
  return item.backdrop_path
    ? `${backdropBaseUrl}${item.backdrop_path}`
    : fallbackBackdrop
}

function getVideosEndpoint(media: TmdbMediaItem) {
  const mediaType = getMediaType(media)
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

function createGenreMap(genres: TmdbGenre[]) {
  return new Map(genres.map((genre) => [genre.id, genre.name]))
}

function getGenreNames(
  item: TmdbMediaItem | undefined,
  mediaType: MediaType | undefined,
  genreMaps: GenreMaps
) {
  if (!item?.genre_ids?.length || !mediaType) {
    return []
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

function readDominantColor(imageUrl: string) {
  return new Promise<string>((resolve) => {
    const image = new Image()

    image.crossOrigin = "anonymous"
    image.src = imageUrl

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d", { willReadFrequently: true })

        if (!context) {
          resolve("5, 5, 5")
          return
        }

        canvas.width = 32
        canvas.height = 32
        context.drawImage(image, 0, 0, canvas.width, canvas.height)

        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
        let red = 0
        let green = 0
        let blue = 0
        let count = 0

        for (let index = 0; index < pixels.length; index += 16) {
          const alpha = pixels[index + 3]

          if (alpha < 128) {
            continue
          }

          red += pixels[index]
          green += pixels[index + 1]
          blue += pixels[index + 2]
          count += 1
        }

        if (count === 0) {
          resolve("5, 5, 5")
          return
        }

        resolve(
          `${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(
            blue / count
          )}`
        )
      } catch {
        resolve("5, 5, 5")
      }
    }

    image.onerror = () => resolve("5, 5, 5")
  })
}

export function HeroSection() {
  const [heroItems, setHeroItems] = useState<HeroMedia[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [isLoading, setIsLoading] = useState(true)
  const [accentColor, setAccentColor] = useState("5, 5, 5")
  const [genreMaps, setGenreMaps] = useState<GenreMaps>({
    movie: new Map(),
    tv: new Map(),
  })

  const activeHero = heroItems[activeIndex]
  const activeItem = activeHero?.item
  const activeMediaType = activeHero?.mediaType
  const activeVideo = activeHero?.video
  const activeBackdrop = activeItem ? getBackdropUrl(activeItem) : fallbackBackdrop
  const activeGenres = getGenreNames(activeItem, activeMediaType, genreMaps)
  const previewItems: Array<HeroMedia | null> = isLoading
    ? Array.from({ length: 10 }, () => null)
    : heroItems

  useEffect(() => {
    const abortController = new AbortController()

    async function loadHeroMedia() {
      setIsLoading(true)

      const [trending, movieGenres, tvGenres] = await Promise.all([
        fetchApiData<TmdbListResponse<TmdbMediaItem>>({
          endpoint: endpoints.trending.all_week.api,
          method: endpoints.trending.all_week.method,
          params: {
            language: "en-US",
            page: 1,
          },
          signal: abortController.signal,
        }),
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

      const randomItems = shuffleItems(
        trending?.results.filter((item) => {
          const mediaType = getMediaType(item)

          return mediaType === "movie" || mediaType === "tv"
        }) ?? []
      ).slice(0, 10)

      const mediaWithVideos = await Promise.all(
        randomItems.map(async (item) => {
          const videos = await fetchApiData<TmdbListResponse<TmdbVideo>>({
            endpoint: getVideosEndpoint(item),
            method: "GET",
            params: {
              language: "en-US",
            },
            signal: abortController.signal,
          })

          return {
            item,
            mediaType: getMediaType(item),
            video: getBestVideo(videos?.results ?? []),
          }
        })
      )

      if (abortController.signal.aborted) {
        return
      }

      setGenreMaps({
        movie: createGenreMap(movieGenres?.genres ?? []),
        tv: createGenreMap(tvGenres?.genres ?? []),
      })

      setHeroItems(mediaWithVideos)
      setActiveIndex(0)
      setIsLoading(false)
    }

    loadHeroMedia()

    return () => abortController.abort()
  }, [])

  useEffect(() => {
    let isMounted = true

    readDominantColor(activeBackdrop).then((color) => {
      if (isMounted) {
        setAccentColor(color)
        document.documentElement.style.setProperty("--hero-accent-color", color)
      }
    })

    return () => {
      isMounted = false
    }
  }, [activeBackdrop])

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const handleSelect = () => {
      setActiveIndex(carouselApi.selectedScrollSnap())
    }

    handleSelect()
    carouselApi.on("select", handleSelect)
    carouselApi.on("reInit", handleSelect)

    return () => {
      carouselApi.off("select", handleSelect)
      carouselApi.off("reInit", handleSelect)
    }
  }, [carouselApi])

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

  return (
    <section className="relative isolate -mt-36 overflow-hidden bg-[#050505] pt-36 text-white lg:-mt-20 lg:pt-20">
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

        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundColor: `rgba(${accentColor}, 0.18)`,
          }}
        />
        <div className="absolute inset-0 -z-10 bg-[#050505]/16" />

        <div className="mx-auto flex min-h-[clamp(40rem,82vh,56rem)] w-full items-end px-3 pb-8 sm:min-h-[clamp(36rem,76vh,54rem)] sm:px-4 lg:pb-12">
          <div className="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-end xl:gap-8">
            <div className="max-w-3xl space-y-5">
              <Badge className="gap-2 rounded-md border-white/12 bg-white/[0.1] px-3 py-1 text-sm font-medium text-white shadow-inner hover:bg-white/[0.1]">
                <Play className="h-4 w-4 fill-current" />
                {activeVideo ? "Now playing trailer" : "Featured preview"}
              </Badge>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl leading-tight font-bold sm:text-5xl lg:text-6xl">
                  {activeItem ? getTitle(activeItem) : "Loading Vexto picks"}
                </h1>
                <p className="line-clamp-3 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                  {activeItem?.overview ??
                    "Fetching a fresh random set of movies and series."}
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
                  {activeItem ? formatRating(activeItem.vote_average) : "NR"}
                </Badge>
                <Badge variant="secondary" className="gap-1 rounded-md">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {activeItem ? getReleaseYear(activeItem) : "TBA"}
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

              <Button className="h-10 rounded-md bg-white px-4 text-sm font-semibold text-black hover:bg-white/90">
                <Play className="h-4 w-4 fill-current" />
                Play preview
              </Button>
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white/86">
                    Trailer Queue
                  </p>
                  <p className="text-xs text-white/56">
                    Random picks from trending titles
                  </p>
                </div>
                <Badge className="rounded-md bg-white/12 text-white hover:bg-white/12">
                  {heroItems.length || 10}
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
                        key={item?.id ?? index}
                        className="basis-[86%] pl-3 sm:basis-[58%] lg:basis-[86%] xl:basis-[78%]"
                      >
                        <Card
                          role="button"
                          tabIndex={item ? 0 : -1}
                          className={cn(
                            "h-44 cursor-pointer rounded-lg border-white/10 bg-white/[0.07] py-0 text-white shadow-lg shadow-black/10 transition hover:bg-white/[0.12]",
                            isActive &&
                              "border-white/45 bg-white/[0.16] shadow-black/25"
                          )}
                          onClick={() => {
                            if (item) {
                              carouselApi?.scrollTo(index)
                              setActiveIndex(index)
                            }
                          }}
                          onKeyDown={(event) => {
                            if (!item) {
                              return
                            }

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
                                  {item ? getTitle(item) : "Loading preview"}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-xs leading-5 text-white/58">
                                  {item?.overview ||
                                    "Fetching trailer information from TMDB."}
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
                                {item ? formatRating(item.vote_average) : "NR"}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="gap-1 rounded-md text-xs"
                              >
                                <CalendarDays className="h-3 w-3" />
                                {item ? getReleaseYear(item) : "TBA"}
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
    </section>
  )
}
