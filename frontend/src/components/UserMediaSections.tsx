import { useEffect, useState, type ReactNode } from "react"
import { BookmarkCheck, Clock3 } from "lucide-react"

import backendApiEndPoints from "@/api-fetch-endpoints/backendApiEndPoints.json"
import { WatchListButton } from "@/components/WatchListButton"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { backendApiData } from "@/service/backendApiData"

type BackendApiEndPoints = {
  watch_list: {
    base: string
  }
  recent: {
    base: string
  }
}

type StoredUser = {
  _id?: string
  id?: string
}

type BackendResponse<T> = {
  data?: T[]
}

type UserMediaRecord = {
  _id?: string
  user_id?: string
  media_id: string
  media_type: string
  title: string
  overview?: string
  poster_url?: string
  background_image_url?: string
  source?: string
  metadata?: Record<string, unknown>
  watched_at?: string
  created_date?: string
  is_active?: boolean
}

type UserMediaSectionsProps = {
  className?: string
}

const endpoints = backendApiEndPoints as BackendApiEndPoints
const fallbackPoster =
  "https://placehold.co/342x513/111111/fafafa?text=No+Poster"

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

function getMediaHref(item: UserMediaRecord) {
  if (item.media_type === "tv" || item.media_type === "series") {
    return `/series/${item.media_id}`
  }

  if (item.media_type === "anime") {
    return `/anime/${item.media_id}`
  }

  return `/movie/${item.media_id}`
}

function getMediaLabel(mediaType: string) {
  if (mediaType === "tv" || mediaType === "series") {
    return "Series"
  }

  if (mediaType === "anime") {
    return "Anime"
  }

  return "Movie"
}

function UserMediaRail({
  title,
  description,
  icon,
  items,
  emptyText,
}: {
  title: string
  description: string
  icon: ReactNode
  items: UserMediaRecord[]
  emptyText: string
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="secondary" className="gap-2 rounded-md px-3 py-1">
            {icon}
            {title}
          </Badge>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="rounded-lg border-dashed">
          <CardContent className="p-5 text-sm text-muted-foreground">
            {emptyText}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 min-[520px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Card
              key={`${title}-${item._id ?? item.media_type}-${item.media_id}`}
              className="group overflow-hidden rounded-lg py-0 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <a href={getMediaHref(item)} aria-label={`Open ${item.title}`}>
                  <img
                    src={item.background_image_url || item.poster_url || fallbackPoster}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </a>
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-2 right-2">
                  <WatchListButton
                    initialRecord={
                      title === "Watch List"
                        ? {
                            _id: item._id,
                            is_active: item.is_active,
                          }
                        : undefined
                    }
                    item={{
                      media_id: item.media_id,
                      media_type: item.media_type,
                      title: item.title,
                      overview: item.overview,
                      poster_url: item.poster_url,
                      background_image_url: item.background_image_url,
                      source: item.source,
                      metadata: item.metadata,
                    }}
                  />
                </div>
              </div>

              <CardHeader className="gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="rounded-md text-xs">
                    {getMediaLabel(item.media_type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.metadata?.rating
                      ? Number(item.metadata.rating).toFixed(1)
                      : "NR"}
                  </span>
                </div>
                <CardTitle className="line-clamp-1 text-base">
                  {item.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs leading-5">
                  {item.overview || "No description available yet."}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

export function UserMediaSections({ className }: UserMediaSectionsProps) {
  const [watchList, setWatchList] = useState<UserMediaRecord[]>([])
  const [recent, setRecent] = useState<UserMediaRecord[]>([])

  useEffect(() => {
    const userId = getUserId()

    if (!userId) {
      return
    }

    async function loadUserMedia() {
      const [watchListResponse, recentResponse] = await Promise.all([
        backendApiData<BackendResponse<UserMediaRecord>>({
          method: "GET",
          url: endpoints.watch_list.base,
          params: { user_id: userId, is_active: true, limit: 8 },
        }),
        backendApiData<BackendResponse<UserMediaRecord>>({
          method: "GET",
          url: endpoints.recent.base,
          params: { user_id: userId, is_active: true, limit: 8 },
        }),
      ])

      setWatchList(watchListResponse?.data ?? [])
      setRecent(recentResponse?.data ?? [])
    }

    void loadUserMedia()
  }, [])

  return (
    <div className={className}>
      <UserMediaRail
        title="Watch List"
        description="Saved movies, series, and anime from your Quantum Clap browsing."
        icon={<BookmarkCheck className="h-4 w-4" />}
        items={watchList}
        emptyText="Your watch list is empty. Use the bookmark icon on any media card to save items here."
      />

      <UserMediaRail
        title="Recent"
        description="The latest titles you opened from your account."
        icon={<Clock3 className="h-4 w-4" />}
        items={recent}
        emptyText="No recent activity yet. Open a movie, series, or anime detail page to start this list."
      />
    </div>
  )
}
