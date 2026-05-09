import { useEffect, useMemo, useState } from "react"
import { createFileRoute, Outlet } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import { ThreeDMarquee } from "@/components/ui/3d-marquee"
import { fetchApiData, type HttpMethod } from "@/service/fetchApiData"

export const Route = createFileRoute("/__authLayout")({
  component: RouteComponent,
})

type EndpointConfig = {
  method: HttpMethod
  api: string
}

type ApiEndpoints = {
  trending: {
    all_week: EndpointConfig
  }
}

type TrendingItem = {
  backdrop_path: string | null
  poster_path: string | null
  profile_path?: string | null
}

type TrendingResponse = {
  results?: TrendingItem[]
}

const endpoints = apiEndPoints as ApiEndpoints
const backdropBaseUrl = "https://image.tmdb.org/t/p/w1280"
const posterBaseUrl = "https://image.tmdb.org/t/p/w780"
const fallbackMarqueeImages = [
  "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
  "https://image.tmdb.org/t/p/w1280/9nhjGaFLKtddDPtPaX5EmKqsWdH.jpg",
  "https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
  "https://image.tmdb.org/t/p/w1280/8rpDcsfLJypbO6vREc0547VKqEv.jpg",
  "https://image.tmdb.org/t/p/w1280/jXJxMcVoEuXzym3vFnjqDW4ifo6.jpg",
  "https://image.tmdb.org/t/p/w1280/5YZbUmjbMa3ClvSW1Wj3D6XGolb.jpg",
  "https://image.tmdb.org/t/p/w1280/sRLC052ieEzkQs9dEtPMfFxYkej.jpg",
  "https://image.tmdb.org/t/p/w1280/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg",
]

function shuffleImages(images: string[]) {
  return [...images]
    .map((image) => ({ image, sort: Math.random() }))
    .sort((first, second) => first.sort - second.sort)
    .map(({ image }) => image)
}

function uniqueImages(images: string[]) {
  return Array.from(new Set(images))
}

function fillMarqueeImages(images: string[], count = 72) {
  const source = uniqueImages(
    images.length > 0 ? images : fallbackMarqueeImages
  )
  const result: string[] = []

  while (result.length < count) {
    const shuffledSource = shuffleImages(source).filter(
      (image) => image !== result[result.length - 1]
    )

    result.push(...shuffledSource)
  }

  return result.slice(0, count)
}

function getTrendingImage(item: TrendingItem) {
  if (item.backdrop_path) {
    return `${backdropBaseUrl}${item.backdrop_path}`
  }

  if (item.poster_path) {
    return `${posterBaseUrl}${item.poster_path}`
  }

  if (item.profile_path) {
    return `${posterBaseUrl}${item.profile_path}`
  }

  return null
}

function RouteComponent() {
  const [trendingImages, setTrendingImages] = useState<string[]>(
    fallbackMarqueeImages
  )
  const [shuffleSeed, setShuffleSeed] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadTrendingImages() {
      const responses = await Promise.all(
        [1, 2, 3, 4].map((page) =>
          fetchApiData<TrendingResponse>({
            endpoint: endpoints.trending.all_week.api,
            method: endpoints.trending.all_week.method,
            params: {
              language: "en-US",
              page,
            },
          })
        )
      )

      if (!isMounted) {
        return
      }

      const images = responses
        .flatMap((response) => response?.results ?? [])
        .map(getTrendingImage)
        .filter((image): image is string => Boolean(image))

      setTrendingImages(
        images.length > 0 ? uniqueImages(images) : fallbackMarqueeImages
      )
    }

    void loadTrendingImages()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setShuffleSeed((currentSeed) => currentSeed + 1)
    }, 120000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const marqueeImages = useMemo(
    () => shuffleImages(fillMarqueeImages(trendingImages)),
    [shuffleSeed, trendingImages]
  )

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#101010] text-foreground">
      <div className="absolute -inset-x-[35vw] -inset-y-[30vh] opacity-60">
        <ThreeDMarquee
          images={marqueeImages}
          fullBleed
          className="h-full rounded-none max-sm:h-full"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_32%),linear-gradient(90deg,rgba(16,16,16,0.95),rgba(16,16,16,0.72)_42%,rgba(16,16,16,0.94))]" />
      <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px]" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </section>
    </main>
  )
}
