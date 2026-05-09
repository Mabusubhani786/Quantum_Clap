export type BackendHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"

export type BackendParamValue = string | number | boolean | null | undefined
export type BackendParams = Record<string, BackendParamValue>

export type BackendApiRequest = {
  method: BackendHttpMethod
  url: string
  params?: BackendParams
  payload?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
}

const getBackendBaseUrl = () =>
  (import.meta.env.VITE_BACKEND_API_BASE_URL ?? "").replace(/\/+$/, "")

const resolvePathParams = (url: string, params?: BackendParams) => {
  const remainingParams = { ...(params ?? {}) }
  const resolvedUrl = url.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = remainingParams[key]
    delete remainingParams[key]
    return value === undefined || value === null
      ? ""
      : encodeURIComponent(String(value))
  })

  return { resolvedUrl, remainingParams }
}

const appendIdParam = (
  url: string,
  params: BackendParams,
  method: BackendHttpMethod
) => {
  const id = params.id
  if (
    id === undefined ||
    id === null ||
    url.includes("{id}") ||
    method === "POST"
  ) {
    return url
  }

  delete params.id
  return `${url.replace(/\/+$/, "")}/${encodeURIComponent(String(id))}`
}

const buildBackendUrl = (url: string, params?: BackendParams) => {
  const baseUrl = getBackendBaseUrl()
  const method = "GET"
  const { resolvedUrl, remainingParams } = resolvePathParams(url, params)
  const urlWithId = appendIdParam(resolvedUrl, remainingParams, method)
  const requestUrl = new URL(
    urlWithId.startsWith("http") ? urlWithId : `${baseUrl}${urlWithId}`
  )

  Object.entries(remainingParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      requestUrl.searchParams.append(key, String(value))
    }
  })

  return requestUrl.toString()
}

export async function backendApiData<TData = unknown>({
  method,
  url,
  params,
  payload,
  headers,
  signal,
}: BackendApiRequest): Promise<TData | null> {
  try {
    const requestHeaders = new Headers(headers)
    requestHeaders.set("accept", "application/json")

    const hasPayload =
      payload !== undefined && method !== "GET" && method !== "HEAD"
    if (hasPayload && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json")
    }

    const { resolvedUrl, remainingParams } = resolvePathParams(url, params)
    const urlWithId = appendIdParam(resolvedUrl, remainingParams, method)

    const response = await fetch(buildBackendUrl(urlWithId, remainingParams), {
      method,
      headers: requestHeaders,
      signal,
      body: hasPayload ? JSON.stringify(payload) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(
        errorData?.message ??
          `Error: ${response.status} - ${response.statusText}`
      )
    }

    if (response.status === 204 || method === "HEAD") {
      return null
    }

    return (await response.json()) as TData
  } catch (error) {
    console.error("Backend API Fetch Error:", error)
    return null
  }
}
