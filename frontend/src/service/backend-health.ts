import { buildBackendUrl, getBackendBaseUrl } from "@/lib/backend-url"

const HEALTH_ENDPOINT = "/health"
const HEALTHCHECK_TIMEOUT_MS = 15000

let backendWarmupPromise: Promise<boolean> | null = null

const createTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeoutId),
  }
}

export const isBackendConfigured = () => Boolean(getBackendBaseUrl())

export async function warmBackendConnection() {
  if (!isBackendConfigured()) {
    return false
  }

  backendWarmupPromise ??= (async () => {
    const { signal, clear } = createTimeoutSignal(HEALTHCHECK_TIMEOUT_MS)

    try {
      const response = await fetch(buildBackendUrl(HEALTH_ENDPOINT), {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        signal,
      })

      return response.ok
    } catch {
      return false
    } finally {
      clear()
      backendWarmupPromise = null
    }
  })()

  return backendWarmupPromise
}
