import {
  clearInFlightRequest,
  getCachedResponse,
  getInFlightRequest,
  setCachedResponse,
  setInFlightRequest,
  withAbortSignal,
} from "@/lib/request-cache"

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"

export type FetchParamValue = string | number | boolean | null | undefined
export type FetchParams = Record<string, FetchParamValue>

export type FetchApiRequest = {
  endpoint: string
  method?: HttpMethod
  params?: FetchParams
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  cacheTtlMs?: number
}

const DEFAULT_GET_CACHE_TTL_MS = 120_000

function buildRequestKey(method: HttpMethod, url: URL, body?: unknown) {
  return JSON.stringify({
    method,
    url: url.toString(),
    body: body ?? null,
  })
}

export async function fetchApiData<TData = unknown>(
  endpoint: string,
  params?: FetchParams,
): Promise<TData | null>

export async function fetchApiData<TData = unknown>(
  request: FetchApiRequest,
): Promise<TData | null>

export async function fetchApiData<TData = unknown>(
  endpointOrRequest: string | FetchApiRequest,
  params?: FetchParams,
): Promise<TData | null> {
  const request =
    typeof endpointOrRequest === "string"
      ? { endpoint: endpointOrRequest, method: "GET" as const, params }
      : endpointOrRequest

  const {
    endpoint,
    method = "GET",
    body,
    headers,
    signal,
    cacheTtlMs = method === "GET" ? DEFAULT_GET_CACHE_TTL_MS : 0,
  } = request

  const url = new URL(endpoint)

  if (request.params) {
    Object.entries(request.params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const hasBody = body !== undefined && method !== "GET" && method !== "HEAD"
  const requestKey = buildRequestKey(method, url, hasBody ? body : undefined)

  try {

    const requestHeaders = new Headers(headers)
    requestHeaders.set("accept", import.meta.env.VITE_API_ACCEPT ?? "application/json")

    if (import.meta.env.VITE_TMDB_AUTHORIZATION) {
      requestHeaders.set("Authorization", import.meta.env.VITE_TMDB_AUTHORIZATION)
    }

    if (hasBody && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json")
    }

    if (method === "GET") {
      const cachedResponse = getCachedResponse<TData>(requestKey)
      if (cachedResponse !== null) {
        return cachedResponse
      }
    }

    const inFlightRequest = getInFlightRequest<TData>(requestKey)
    if (inFlightRequest) {
      return await withAbortSignal(inFlightRequest, signal)
    }

    const requestPromise = (async () => {
      const response = await fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: hasBody ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`)
      }

      if (response.status === 204 || method === "HEAD") {
        return null
      }

      return (await response.json()) as TData
    })()

    setInFlightRequest(requestKey, requestPromise)
    requestPromise.finally(() => clearInFlightRequest(requestKey))

    const response = await withAbortSignal(requestPromise, signal)

    if (method === "GET" && response !== null) {
      setCachedResponse(requestKey, response, cacheTtlMs)
    }

    return response
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null
    }

    console.error("API Fetch Error:", error)
    return null
  }
}
