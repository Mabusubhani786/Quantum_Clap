import { ensureValidAccessToken } from "@/lib/auth-session"
import { buildBackendUrl } from "@/lib/backend-url"
import {
  clearInFlightRequest,
  getInFlightRequest,
  setInFlightRequest,
  withAbortSignal,
} from "@/lib/request-cache"

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
  timeoutMs?: number
}

const refreshEndpoint = "/jwt_user/refresh"
const publicAuthEndpoints = new Set(["/sign-in", refreshEndpoint])
const DEFAULT_BACKEND_TIMEOUT_MS = 20000

function buildRequestKey(
  method: BackendHttpMethod,
  requestUrl: string,
  payload?: unknown
) {
  return JSON.stringify({
    method,
    url: requestUrl,
    payload: payload ?? null,
  })
}

function shouldSkipTokenRefresh(url: string, method: BackendHttpMethod) {
  return publicAuthEndpoints.has(url) || (url === "/user" && method === "POST")
}

function getStoredUserId() {
  if (typeof window === "undefined") {
    return undefined
  }

  try {
    const storedUser = sessionStorage.getItem("user")
    if (!storedUser) {
      return undefined
    }

    const user = JSON.parse(storedUser) as { _id?: string; id?: string }
    return user._id ?? user.id
  } catch {
    return undefined
  }
}

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

const buildRequestUrl = (url: string, params?: BackendParams) => {
  const method = "GET"
  const { resolvedUrl, remainingParams } = resolvePathParams(url, params)
  const urlWithId = appendIdParam(resolvedUrl, remainingParams, method)
  const requestUrl = new URL(buildBackendUrl(urlWithId))

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
  timeoutMs = DEFAULT_BACKEND_TIMEOUT_MS,
}: BackendApiRequest): Promise<TData | null> {
  let timeoutId: number | null = null

  try {
    const skipTokenRefresh = shouldSkipTokenRefresh(url, method)

    if (!skipTokenRefresh) {
      await ensureValidAccessToken()
    }

    const requestHeaders = new Headers(headers)
    requestHeaders.set("accept", "application/json")
    const userId = getStoredUserId()
    const accessToken = sessionStorage.getItem("access_token")

    if (userId && !requestHeaders.has("x_user_id")) {
      requestHeaders.set("x_user_id", userId)
    }

    if (accessToken && !requestHeaders.has("Authorization")) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`)
    }

    const hasPayload =
      payload !== undefined && method !== "GET" && method !== "HEAD"
    if (hasPayload && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json")
    }

    const { resolvedUrl, remainingParams } = resolvePathParams(url, params)
    const urlWithId = appendIdParam(resolvedUrl, remainingParams, method)

    const requestUrl = buildRequestUrl(urlWithId, remainingParams)
    const abortController = signal ? null : new AbortController()
    timeoutId = abortController
      ? window.setTimeout(() => abortController.abort(), timeoutMs)
      : null
    const requestKey = buildRequestKey(method, requestUrl, payload)
    const requestSignal = signal ?? abortController?.signal
    const executeRequest = () =>
      fetch(requestUrl, {
        method,
        headers: requestHeaders,
        signal: requestSignal,
        body: hasPayload ? JSON.stringify(payload) : undefined,
      })

    const inFlightRequest =
      method === "GET" ? getInFlightRequest<Response>(requestKey) : null

    let response = inFlightRequest
      ? await withAbortSignal(inFlightRequest, signal)
      : await (async () => {
          const nextRequest = executeRequest()
          if (method === "GET") {
            setInFlightRequest(requestKey, nextRequest)
            nextRequest.finally(() => clearInFlightRequest(requestKey))
          }

          return await withAbortSignal(nextRequest, signal)
        })()

    if (response.status === 401 && !skipTokenRefresh) {
      const refreshed = await ensureValidAccessToken({ force: true })

      if (refreshed) {
        const nextAccessToken = sessionStorage.getItem("access_token")
        if (nextAccessToken) {
          requestHeaders.set("Authorization", `Bearer ${nextAccessToken}`)
        }

        response = await executeRequest()
      }
    }

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
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Backend API Fetch Error: request timed out")
      return null
    }

    console.error("Backend API Fetch Error:", error)
    return null
  } finally {
    if (!signal) {
      window.clearTimeout(timeoutId ?? undefined)
    }
  }
}
