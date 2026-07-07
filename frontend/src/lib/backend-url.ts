export const getBackendBaseUrl = () =>
  (import.meta.env.VITE_BACKEND_API_BASE_URL ?? "").replace(/\/+$/, "")

export const buildBackendUrl = (path: string) => {
  const baseUrl = getBackendBaseUrl()

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  return `${baseUrl}${path}`
}
