import { useMemo, useState, type MouseEvent } from "react"
import { BookmarkCheck, BookmarkPlus, Loader2 } from "lucide-react"

import backendApiEndPoints from "@/api-fetch-endpoints/backendApiEndPoints.json"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { backendApiData } from "@/service/backendApiData"

type BackendApiEndPoints = {
  watch_list: {
    base: string
  }
}

type StoredUser = {
  _id?: string
  id?: string
}

type BackendResponse<T> = {
  data?: T | T[]
}

type WatchListRecord = {
  _id?: string
  is_active?: boolean
}

export type WatchListMediaInput = {
  media_id: string | number
  media_type: string
  title: string
  overview?: string
  poster_url?: string
  background_image_url?: string
  source?: string
  metadata?: Record<string, unknown>
}

type WatchListButtonProps = {
  item: WatchListMediaInput
  className?: string
}

const endpoints = backendApiEndPoints as BackendApiEndPoints

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

function getCacheKey(userId: string | undefined, item: WatchListMediaInput) {
  return userId ? `${userId}:${item.media_type}:${item.media_id}` : ""
}

function readWatchListCache() {
  try {
    return JSON.parse(
      sessionStorage.getItem("watch_list_cache") ?? "{}"
    ) as Record<string, WatchListRecord>
  } catch {
    return {}
  }
}

function writeWatchListCache(
  cacheKey: string,
  record: WatchListRecord | null
) {
  if (!cacheKey) {
    return
  }

  const cache = readWatchListCache()
  if (record) {
    cache[cacheKey] = record
  } else {
    delete cache[cacheKey]
  }

  sessionStorage.setItem("watch_list_cache", JSON.stringify(cache))
}

function getResponseRecord(response: BackendResponse<WatchListRecord> | null) {
  const data = response?.data
  return Array.isArray(data) ? data[0] : data
}

export function WatchListButton({ item, className }: WatchListButtonProps) {
  const userId = getUserId()
  const cacheKey = useMemo(() => getCacheKey(userId, item), [item, userId])
  const cachedRecord = cacheKey ? readWatchListCache()[cacheKey] : undefined
  const [record, setRecord] = useState<WatchListRecord | null>(
    cachedRecord ?? null
  )
  const [isLoading, setIsLoading] = useState(false)
  const isSaved = Boolean(record?._id && record.is_active !== false)

  async function findExistingRecord() {
    if (!userId) {
      return null
    }

    const response = await backendApiData<BackendResponse<WatchListRecord>>({
      method: "GET",
      url: endpoints.watch_list.base,
      params: {
        user_id: userId,
        media_id: item.media_id,
        media_type: item.media_type,
      },
    })

    return getResponseRecord(response) ?? null
  }

  async function handleWatchListClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!userId || isLoading) {
      return
    }

    setIsLoading(true)

    if (isSaved && record?._id) {
      const response = await backendApiData({
        method: "DELETE",
        url: endpoints.watch_list.base,
        params: { id: record._id },
      })

      if (response) {
        setRecord(null)
        writeWatchListCache(cacheKey, null)
      }

      setIsLoading(false)
      return
    }

    if (record?._id && record.is_active === false) {
      const response = await backendApiData<BackendResponse<WatchListRecord>>({
        method: "PATCH",
        url: endpoints.watch_list.base,
        params: { id: record._id },
        payload: { is_active: true },
      })
      const updatedRecord = getResponseRecord(response)

      if (updatedRecord?._id) {
        setRecord(updatedRecord)
        writeWatchListCache(cacheKey, updatedRecord)
      }

      setIsLoading(false)
      return
    }

    const response = await backendApiData<BackendResponse<WatchListRecord>>({
      method: "POST",
      url: endpoints.watch_list.base,
      payload: {
        user_id: userId,
        media_id: String(item.media_id),
        media_type: item.media_type,
        title: item.title,
        overview: item.overview,
        poster_url: item.poster_url,
        background_image_url: item.background_image_url,
        source: item.source ?? "tmdb",
        metadata: item.metadata ?? {},
        is_active: true,
      },
    })
    const createdRecord = getResponseRecord(response) ?? (await findExistingRecord())

    if (createdRecord?._id) {
      setRecord(createdRecord)
      writeWatchListCache(cacheKey, createdRecord)
    }

    setIsLoading(false)
  }

  return (
    <Button
      aria-label={isSaved ? "Remove from watch list" : "Add to watch list"}
      className={cn(
        "size-9 rounded-full border border-white/20 bg-black/55 p-0 text-white shadow-lg backdrop-blur-md transition hover:bg-black/75",
        isSaved && "bg-white text-black hover:bg-white/90",
        className
      )}
      disabled={!userId || isLoading}
      onClick={handleWatchListClick}
      title={isSaved ? "Remove from watch list" : "Add to watch list"}
      type="button"
      variant="ghost"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="size-4" />
      ) : (
        <BookmarkPlus className="size-4" />
      )}
    </Button>
  )
}
