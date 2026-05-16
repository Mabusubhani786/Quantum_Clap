import type { FetchParams } from "@/service/fetchApiData"

export type CatalogMediaType = "movie" | "tv"

export const catalogFilterKeys = [
  "movie_release_status",
  "with_original_language",
  "primary_release_year",
  "vote_average.gte",
  "with_genres",
  "sort_by",
  "release_date.gte",
] as const

export type CatalogFilterKey = (typeof catalogFilterKeys)[number]
export type CatalogFilterSearch = Partial<Record<CatalogFilterKey, string>>
export type MovieReleaseStatus = "all" | "upcoming" | "today"

const tvSortByMap: Record<string, string> = {
  "release_date.asc": "first_air_date.asc",
  "release_date.desc": "first_air_date.desc",
}

function getSearchValue(search: Record<string, unknown>, key: CatalogFilterKey) {
  const value = search[key]

  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : ""
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getRelativeDateKey(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)

  return getDateKey(date)
}

function applyMovieReleaseStatusParams(
  params: FetchParams,
  status: string | undefined
) {
  if (!status || status === "all") {
    return
  }

  if (status === "upcoming") {
    params["primary_release_date.gte"] = getRelativeDateKey(1)
    return
  }

  if (status === "today") {
    const today = getRelativeDateKey(0)
    params["primary_release_date.gte"] = today
    params["primary_release_date.lte"] = today
    return
  }

}

export function getCatalogFilterSearch(
  search: Record<string, unknown>
): CatalogFilterSearch {
  return catalogFilterKeys.reduce<CatalogFilterSearch>((values, key) => {
    const value = getSearchValue(search, key)

    if (value) {
      values[key] = value
    }

    return values
  }, {})
}

export function getCatalogFilterRequestParams(
  search: Record<string, unknown>,
  mediaType: CatalogMediaType
) {
  const values = getCatalogFilterSearch(search)

  const params = catalogFilterKeys.reduce<FetchParams>((params, key) => {
    const value = values[key]

    if (!value) {
      return params
    }

    if (key === "movie_release_status") {
      return params
    }

    if (key === "primary_release_year") {
      if (!/^\d{4}$/.test(value)) {
        return params
      }

      params[mediaType === "tv" ? "first_air_date_year" : key] = value
      return params
    }

    if (key === "release_date.gte" && mediaType === "tv") {
      params["first_air_date.gte"] = value
      return params
    }

    if (key === "sort_by" && mediaType === "tv") {
      params.sort_by = tvSortByMap[value] ?? value
      return params
    }

    params[key] = value
    return params
  }, {})

  if (mediaType === "movie") {
    applyMovieReleaseStatusParams(params, values.movie_release_status)
  }

  return params
}

export function clearCatalogFilterSearch(search: Record<string, unknown>) {
  const nextSearch = { ...search }

  catalogFilterKeys.forEach((key) => {
    delete nextSearch[key]
  })

  return nextSearch
}
