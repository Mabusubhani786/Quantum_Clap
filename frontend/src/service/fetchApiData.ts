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

  const { endpoint, method = "GET", body, headers, signal } = request

  try {
    const url = new URL(endpoint)

    if (request.params) {
      Object.entries(request.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const requestHeaders = new Headers(headers)
    requestHeaders.set("accept", import.meta.env.VITE_API_ACCEPT ?? "application/json")

    if (import.meta.env.VITE_TMDB_AUTHORIZATION) {
      requestHeaders.set("Authorization", import.meta.env.VITE_TMDB_AUTHORIZATION)
    }

    const hasBody = body !== undefined && method !== "GET" && method !== "HEAD"

    if (hasBody && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json")
    }

    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      signal,
      body: hasBody ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`)
    }

    if (response.status === 204 || method === "HEAD") {
      return null
    }

    return (await response.json()) as TData
  } catch (error) {
    console.error("API Fetch Error:", error)
    return null
  }
}
