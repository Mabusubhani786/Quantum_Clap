type CacheEntry<TData> = {
  data: TData
  expiresAt: number
}

const responseCache = new Map<string, CacheEntry<unknown>>()
const inFlightRequests = new Map<string, Promise<unknown>>()

function canStructuredClone(value: unknown) {
  return typeof structuredClone === "function" && value !== undefined
}

export function cloneCachedValue<TData>(value: TData): TData {
  if (!canStructuredClone(value)) {
    return value
  }

  try {
    return structuredClone(value)
  } catch {
    return value
  }
}

export function getCachedResponse<TData>(key: string) {
  const cachedEntry = responseCache.get(key)

  if (!cachedEntry) {
    return null
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    responseCache.delete(key)
    return null
  }

  return cloneCachedValue(cachedEntry.data as TData)
}

export function setCachedResponse<TData>(
  key: string,
  data: TData,
  ttlMs: number
) {
  if (ttlMs <= 0) {
    return
  }

  responseCache.set(key, {
    data: cloneCachedValue(data),
    expiresAt: Date.now() + ttlMs,
  })
}

export function getInFlightRequest<TData>(key: string) {
  return (inFlightRequests.get(key) as Promise<TData> | undefined) ?? null
}

export function setInFlightRequest<TData>(key: string, request: Promise<TData>) {
  inFlightRequests.set(key, request)
}

export function clearInFlightRequest(key: string) {
  inFlightRequests.delete(key)
}

export function invalidateResponseCache(pattern: RegExp) {
  responseCache.forEach((_, key) => {
    if (pattern.test(key)) {
      responseCache.delete(key)
    }
  })
}

export function withAbortSignal<TData>(
  request: Promise<TData>,
  signal?: AbortSignal
) {
  if (!signal) {
    return request
  }

  if (signal.aborted) {
    return Promise.reject(new DOMException("The operation was aborted.", "AbortError"))
  }

  return new Promise<TData>((resolve, reject) => {
    const handleAbort = () => {
      signal.removeEventListener("abort", handleAbort)
      reject(new DOMException("The operation was aborted.", "AbortError"))
    }

    signal.addEventListener("abort", handleAbort, { once: true })

    request.then(
      (value) => {
        signal.removeEventListener("abort", handleAbort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener("abort", handleAbort)
        reject(error)
      }
    )
  })
}
