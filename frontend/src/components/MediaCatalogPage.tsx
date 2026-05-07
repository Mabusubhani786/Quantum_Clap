import { useCallback, useEffect, useMemo, useState } from "react"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import { CardInfo } from "@/components/CardInfo"
import { MediaPagination } from "@/components/MediaPagination"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchApiData, type FetchParams } from "@/service/fetchApiData"

export type EndpointConfig = {
  method: "GET"
  api: string
}

type ApiEndpoints = {
  genres: {
    movie: EndpointConfig
    tv: EndpointConfig
  }
}

export type MediaType = "movie" | "tv"

type TmdbGenre = {
  id: number
  name: string
}

type TmdbGenreResponse = {
  genres: TmdbGenre[]
}

type MediaCatalogItem = {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  genre_ids?: number[]
  media_type?: MediaType
  vote_average: number
  release_date?: string
  first_air_date?: string
}

type TmdbListResponse = {
  page: number
  total_pages: number
  results: MediaCatalogItem[]
}

type GenreMaps = {
  movie: Map<number, string>
  tv: Map<number, string>
}

type MediaCatalogPageProps = {
  title: string
  description: string
  endpoint: EndpointConfig
  mediaType: MediaType
  mediaLabel: string
  detailBasePath: "/movie" | "/series" | "/anime"
  params?: FetchParams
}

const endpoints = apiEndPoints as ApiEndpoints
const posterBaseUrl = "https://image.tmdb.org/t/p/w500"
const backdropBaseUrl = "https://image.tmdb.org/t/p/original"
const fallbackPoster =
  "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg"
const fallbackBackdrop =
  "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg"

function createGenreMap(genres: TmdbGenre[]) {
  return new Map(genres.map((genre) => [genre.id, genre.name]))
}

function getTitle(item: MediaCatalogItem) {
  return item.title ?? item.name ?? "Untitled"
}

function getDate(item: MediaCatalogItem) {
  return item.release_date ?? item.first_air_date
}

function getReleaseYear(item: MediaCatalogItem) {
  const date = getDate(item)

  if (!date) {
    return "TBA"
  }

  return new Date(date).getFullYear().toString()
}

function getPosterUrl(item: MediaCatalogItem) {
  return item.poster_path ? `${posterBaseUrl}${item.poster_path}` : fallbackPoster
}

function getBackdropUrl(item: MediaCatalogItem) {
  return item.backdrop_path
    ? `${backdropBaseUrl}${item.backdrop_path}`
    : fallbackBackdrop
}

function formatRating(rating: number) {
  return rating > 0 ? rating.toFixed(1) : "NR"
}

function getGenreNames(
  item: MediaCatalogItem,
  mediaType: MediaType,
  genreMaps: GenreMaps
) {
  return (item.genre_ids ?? [])
    .map((genreId) => genreMaps[mediaType].get(genreId))
    .filter((genre): genre is string => Boolean(genre))
    .slice(0, 4)
}

function CatalogCardSkeleton() {
  return (
    <Card className="relative isolate @container/card-info overflow-hidden rounded-lg border-border bg-card py-0">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/20 via-transparent to-muted/40" />
      <div className="grid gap-3 p-3 @[28rem]/card-info:grid-cols-[7.25rem_1fr] @[42rem]/card-info:grid-cols-[8.5rem_1fr] @[58rem]/card-info:grid-cols-[10rem_1fr] @[28rem]/card-info:p-4">
        <Skeleton className="aspect-[2/3] w-full rounded-lg bg-muted" />
        <div className="flex min-w-0 flex-col justify-center gap-3 py-1 sm:py-2">
          <div className="space-y-2">
            <Skeleton className="h-7 w-4/5 bg-muted" />
            <Skeleton className="h-6 w-20 bg-muted" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 bg-muted" />
            <Skeleton className="h-6 w-24 bg-muted" />
            <Skeleton className="h-6 w-16 bg-muted" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-11/12 bg-muted" />
            <Skeleton className="h-4 w-2/3 bg-muted" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-5 w-16 bg-muted" />
            <Skeleton className="h-5 w-20 bg-muted" />
          </div>
        </div>
      </div>
    </Card>
  )
}

export function MediaCatalogPage({
  title,
  description,
  endpoint,
  mediaType,
  mediaLabel,
  detailBasePath,
  params,
}: MediaCatalogPageProps) {
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [items, setItems] = useState<MediaCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [genreMaps, setGenreMaps] = useState<GenreMaps>({
    movie: new Map(),
    tv: new Map(),
  })
  const requestParams = useMemo(() => params ?? {}, [params])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("catalog-page-change", {
        detail: {
          route: detailBasePath,
          page,
        },
      })
    )
  }, [detailBasePath, page])

  useEffect(() => {
    const timer = window.setTimeout(() => setPage(1), 0)

    return () => window.clearTimeout(timer)
  }, [endpoint.api, requestParams])

  useEffect(() => {
    const abortController = new AbortController()
    const timer = window.setTimeout(async () => {
      const [movieGenres, tvGenres] = await Promise.all([
        fetchApiData<TmdbGenreResponse>({
          endpoint: endpoints.genres.movie.api,
          method: endpoints.genres.movie.method,
          params: { language: "en-US" },
          signal: abortController.signal,
        }),
        fetchApiData<TmdbGenreResponse>({
          endpoint: endpoints.genres.tv.api,
          method: endpoints.genres.tv.method,
          params: { language: "en-US" },
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
    }, 0)

    return () => {
      window.clearTimeout(timer)
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(false)

      const response = await fetchApiData<TmdbListResponse>({
        endpoint: endpoint.api,
        method: endpoint.method,
        params: {
          language: "en-US",
          page,
          ...requestParams,
        },
        signal: abortController.signal,
      })

      if (abortController.signal.aborted) {
        return
      }

      setItems(response?.results ?? [])
      setTotalPages(Math.min(response?.total_pages ?? 1, 500))
      setLoading(false)
      setError(!response)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      abortController.abort()
    }
  }, [endpoint.api, endpoint.method, page, requestParams])

  const goPrevious = useCallback(() => {
    setPage((currentPage) => Math.max(1, currentPage - 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const goNext = useCallback(() => {
    setPage((currentPage) => Math.min(totalPages, currentPage + 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [totalPages])

  return (
    <section className="w-full space-y-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <MediaPagination
          page={page}
          totalPages={totalPages}
          loading={loading}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      </div>

      {error ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Unable to load {title.toLowerCase()}</CardTitle>
            <CardDescription>
              Check the TMDB authorization env value and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <CatalogCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <CardInfo
              key={item.id}
              posterImage={getPosterUrl(item)}
              backdropImage={getBackdropUrl(item)}
              imageAlt={`${getTitle(item)} poster`}
              title={getTitle(item)}
              mediaType={mediaLabel}
              description={item.overview || "No description available yet."}
              genres={getGenreNames(item, mediaType, genreMaps)}
              rating={formatRating(item.vote_average)}
              releaseDate={getReleaseYear(item)}
              detailTo={`${detailBasePath}/${item.id}`}
            />
          ))}
        </div>
      )}

      <MediaPagination
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPrevious={goPrevious}
        onNext={goNext}
      />
    </section>
  )
}
