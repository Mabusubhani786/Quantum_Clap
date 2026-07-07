import backendApiEndPoints from "@/api-fetch-endpoints/backendApiEndPoints.json"
import { buildBackendUrl } from "@/lib/backend-url"

type BackendAuthEndpoints = {
  auth: {
    refresh: string
  }
}

type AuthTokenPayload = {
  access_expires_at?: string
  access_token?: string
  refresh_expires_at?: string
  refresh_token?: string
  user?: unknown
}

type AuthRefreshResponse = {
  data?: AuthTokenPayload[]
}

export type AuthSession = {
  access_expires_at: string
  access_token: string
  refresh_expires_at: string
  refresh_token: string
  user: unknown
  decoded_token: Record<string, unknown>
}

const endpoints = backendApiEndPoints as BackendAuthEndpoints
const ACCESS_REFRESH_WINDOW_MS = 60_000
let refreshPromise: Promise<boolean> | null = null

export function decodeAccessToken(token: string): Record<string, unknown> | null {
  try {
    const payloadPart = token.split(".")[1]
    if (!payloadPart) {
      return null
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
    const decodedPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((character) => {
          return `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`
        })
        .join("")
    )

    return JSON.parse(decodedPayload) as Record<string, unknown>
  } catch {
    return null
  }
}

export function storeAuthSession(session: AuthSession) {
  sessionStorage.setItem("auth_session", JSON.stringify(session))
  sessionStorage.setItem("access_expires_at", session.access_expires_at)
  sessionStorage.setItem("access_token", session.access_token)
  sessionStorage.setItem("refresh_expires_at", session.refresh_expires_at)
  sessionStorage.setItem("refresh_token", session.refresh_token)
  sessionStorage.setItem("user", JSON.stringify(session.user))
  sessionStorage.setItem("decoded_token", JSON.stringify(session.decoded_token))
}

function updateAuthTokenSession(tokenData: AuthTokenPayload) {
  if (
    !tokenData.access_expires_at ||
    !tokenData.access_token ||
    !tokenData.refresh_expires_at ||
    !tokenData.refresh_token ||
    !tokenData.user
  ) {
    return false
  }

  storeAuthSession({
    access_expires_at: tokenData.access_expires_at,
    access_token: tokenData.access_token,
    refresh_expires_at: tokenData.refresh_expires_at,
    refresh_token: tokenData.refresh_token,
    user: tokenData.user,
    decoded_token: decodeAccessToken(tokenData.access_token) ?? {},
  })

  return true
}

function getAccessExpiryMs() {
  const decodedToken = decodeAccessToken(
    sessionStorage.getItem("access_token") ?? ""
  )
  const expiresAt = decodedToken?.exp

  if (typeof expiresAt === "number") {
    sessionStorage.setItem("decoded_token", JSON.stringify(decodedToken))
    return expiresAt * 1000
  }

  const storedExpiresAt = Date.parse(
    sessionStorage.getItem("access_expires_at") ?? ""
  )
  return Number.isNaN(storedExpiresAt) ? 0 : storedExpiresAt
}

function isRefreshTokenValid() {
  const refreshExpiresAt = Date.parse(
    sessionStorage.getItem("refresh_expires_at") ?? ""
  )

  return !Number.isNaN(refreshExpiresAt) && refreshExpiresAt > Date.now()
}

async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem("refresh_token")
  const accessToken = sessionStorage.getItem("access_token")

  if (!refreshToken || !isRefreshTokenValid()) {
    clearAuthSession()
    return false
  }

  const response = await fetch(buildBackendUrl(endpoints.auth.refresh), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    clearAuthSession()
    return false
  }

  const data = (await response.json()) as AuthRefreshResponse
  return updateAuthTokenSession(data.data?.[0] ?? {})
}

export async function ensureValidAccessToken(options?: {
  force?: boolean
  refreshWindowMs?: number
}) {
  const accessToken = sessionStorage.getItem("access_token")

  if (!accessToken) {
    return false
  }

  const refreshWindowMs = options?.refreshWindowMs ?? ACCESS_REFRESH_WINDOW_MS
  const shouldRefresh =
    options?.force || getAccessExpiryMs() - Date.now() <= refreshWindowMs

  if (!shouldRefresh) {
    return true
  }

  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export function hasAccessToken() {
  return Boolean(sessionStorage.getItem("access_token"))
}

export function isAccessTokenValid() {
  return getAccessExpiryMs() > Date.now()
}

export function clearAuthSession() {
  sessionStorage.removeItem("auth_session")
  sessionStorage.removeItem("access_expires_at")
  sessionStorage.removeItem("access_token")
  sessionStorage.removeItem("refresh_expires_at")
  sessionStorage.removeItem("refresh_token")
  sessionStorage.removeItem("user")
  sessionStorage.removeItem("decoded_token")
  sessionStorage.removeItem("watch_list_cache")
}
