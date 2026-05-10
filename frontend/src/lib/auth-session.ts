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

export function hasAccessToken() {
  return Boolean(sessionStorage.getItem("access_token"))
}

export function isAccessTokenValid() {
  const accessToken = sessionStorage.getItem("access_token")

  if (!accessToken) {
    return false
  }

  const decodedToken = decodeAccessToken(accessToken)
  const expiresAt = decodedToken?.exp

  if (typeof expiresAt !== "number") {
    return false
  }

  sessionStorage.setItem("decoded_token", JSON.stringify(decodedToken))
  return expiresAt * 1000 > Date.now()
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
