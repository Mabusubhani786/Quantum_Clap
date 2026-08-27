import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react"
import {
  Building2,
  Film,
  LogOut,
  Menu,
  Search,
  SlidersHorizontal,
  Tv,
  UserRound,
  X,
} from "lucide-react"
import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import { toast } from "sonner"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import backendApiEndPoints from "@/api-fetch-endpoints/backendApiEndPoints.json"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuIndicator,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { clearAuthSession } from "@/lib/auth-session"
import {
  clearCatalogFilterSearch,
  getCatalogFilterSearch,
  type CatalogFilterKey,
  type MovieReleaseStatus,
} from "@/lib/catalog-filters"
import { cn } from "@/lib/utils"
import { backendApiData } from "@/service/backendApiData"
import { fetchApiData } from "@/service/fetchApiData"

type EndpointConfig = {
  method: "GET"
  api: string
}

type ApiEndpoints = {
  configuration: {
    languages: EndpointConfig
  }
  search: {
    movie: EndpointConfig
    tv: EndpointConfig
    person: EndpointConfig
    company: EndpointConfig
    multi: EndpointConfig
  }
  filters: {
    sort_by: Array<{
      label: string
      value: string
    }>
  }
}

type SearchScope = "movie" | "tv" | "person" | "company" | "multi"

type SearchResult = {
  id: number
  title?: string
  name?: string
  media_type?: "movie" | "tv" | "person"
  poster_path?: string | null
  profile_path?: string | null
  logo_path?: string | null
  overview?: string
  known_for_department?: string
  origin_country?: string
  release_date?: string
  first_air_date?: string
}

type SearchResponse = {
  results: SearchResult[]
}

type TmdbLanguage = {
  english_name: string
  iso_639_1: string
  name: string
}

type NavItem = {
  label: string
  to: "/home" | "/movie" | "/series" | "/anime"
}

type SessionUser = {
  _id?: string
  id?: string
  first_name?: string
  last_name?: string
  user_name?: string
  email?: string
}

type BackendApiEndPoints = {
  auth: {
    revoke: string
  }
}

const navItems: NavItem[] = [
  { label: "Home", to: "/home" },
  { label: "Movies", to: "/movie" },
  { label: "Series", to: "/series" },
  { label: "Anime", to: "/anime" },
]

const endpoints = apiEndPoints as ApiEndpoints
const backendEndpoints = backendApiEndPoints as BackendApiEndPoints
const genreOptions = [
  { label: "Action", value: "28" },
  { label: "Animation", value: "16" },
  { label: "Comedy", value: "35" },
  { label: "Crime", value: "80" },
  { label: "Drama", value: "18" },
  { label: "Family", value: "10751" },
  { label: "Fantasy", value: "14" },
  { label: "Horror", value: "27" },
  { label: "Romance", value: "10749" },
  { label: "Sci-Fi", value: "878" },
  { label: "Thriller", value: "53" },
]
const movieReleaseTabs: Array<{
  label: string
  value: MovieReleaseStatus
}> = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Today", value: "today" },
]

function getLanguageLabel(language: TmdbLanguage) {
  const label = language.english_name || language.name || language.iso_639_1

  return `${label} (${language.iso_639_1})`
}

function sortLanguages(first: TmdbLanguage, second: TmdbLanguage) {
  return getLanguageLabel(first).localeCompare(getLanguageLabel(second))
}

function matchesLanguage(language: TmdbLanguage, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const englishName = language.english_name.toLowerCase()
  const languageCode = language.iso_639_1.toLowerCase()

  return (
    englishName.includes(normalizedQuery) ||
    languageCode.includes(normalizedQuery)
  )
}

function getSessionUser(): SessionUser | null {
  try {
    const storedUser = sessionStorage.getItem("user")
    return storedUser ? (JSON.parse(storedUser) as SessionUser) : null
  } catch {
    return null
  }
}

function getUserInitials(user: SessionUser | null) {
  const firstInitial = user?.first_name?.trim().charAt(0)
  const lastInitial = user?.last_name?.trim().charAt(0)
  const fallbackInitial = user?.user_name?.trim().charAt(0) ?? "U"

  return `${firstInitial ?? fallbackInitial}${lastInitial ?? ""}`.toUpperCase()
}

const routeLabels: Record<string, string> = {
  home: "Home",
  movie: "Movies",
  series: "Series",
  anime: "Anime",
}

function formatSegment(segment: string) {
  return (
    routeLabels[segment] ??
    segment.replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())
  )
}

function useBreadcrumbItems() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return [{ label: "Home", to: "/home" }]
  }

  return segments.map((segment, index) => ({
    label: formatSegment(segment),
    to: `/${segments.slice(0, index + 1).join("/")}`,
  }))
}

function getSearchScope(pathname: string): SearchScope {
  if (pathname.startsWith("/movie")) {
    return "movie"
  }

  if (pathname.startsWith("/series") || pathname.startsWith("/anime")) {
    return "tv"
  }

  if (pathname.startsWith("/person")) {
    return "person"
  }

  if (pathname.startsWith("/company")) {
    return "company"
  }

  return "multi"
}

function getSearchCopy(scope: SearchScope) {
  const copy = {
    movie: "Search movies",
    tv: "Search series",
    person: "Search people",
    company: "Search companies",
    multi: "Search movies, series, people",
  } satisfies Record<SearchScope, string>

  return copy[scope]
}

function getSearchPlaceholders(pathname: string, scope: SearchScope) {
  if (pathname.startsWith("/anime")) {
    return ["Search anime titles", "Try: Attack on Titan", "Try: Demon Slayer"]
  }

  if (pathname.startsWith("/movie")) {
    return ["Search movies", "Try: Inception", "Try: Interstellar"]
  }

  if (pathname.startsWith("/series")) {
    return ["Search series", "Try: Breaking Bad", "Try: The Last of Us"]
  }

  if (pathname.startsWith("/person")) {
    return ["Search people", "Try: Christopher Nolan", "Try: Cillian Murphy"]
  }

  if (pathname.startsWith("/company")) {
    return ["Search companies", "Try: Pixar", "Try: Warner Bros."]
  }

  const baseCopy = getSearchCopy(scope)
  return [baseCopy, "Search by title", "Search by cast or creator"]
}

function getSearchTitle(result: SearchResult) {
  return result.title ?? result.name ?? "Untitled"
}

function getSearchMeta(result: SearchResult, scope: SearchScope) {
  const mediaType = result.media_type ?? scope
  const date = result.release_date ?? result.first_air_date
  const year = date ? new Date(date).getFullYear().toString() : null

  if (mediaType === "person") {
    return result.known_for_department ?? "Person"
  }

  if (scope === "company") {
    return result.origin_country || "Company"
  }

  if (mediaType === "tv") {
    return year ? `Series · ${year}` : "Series"
  }

  return year ? `Movie · ${year}` : "Movie"
}

function getSearchIcon(result: SearchResult, scope: SearchScope) {
  const mediaType = result.media_type ?? scope

  if (mediaType === "person") {
    return <UserRound className="h-4 w-4" />
  }

  if (scope === "company") {
    return <Building2 className="h-4 w-4" />
  }

  if (mediaType === "tv") {
    return <Tv className="h-4 w-4" />
  }

  return <Film className="h-4 w-4" />
}

function getSearchImage(result: SearchResult, scope: SearchScope) {
  const path = result.poster_path ?? result.profile_path ?? result.logo_path

  if (!path) {
    return null
  }

  if (scope === "company" || result.logo_path) {
    return `https://image.tmdb.org/t/p/w185${path}`
  }

  return `https://image.tmdb.org/t/p/w185${path}`
}

function getSearchRoute(
  result: SearchResult,
  scope: SearchScope,
  pathname: string
) {
  const mediaType = result.media_type ?? scope

  if (mediaType === "person") {
    return {
      to: "/person/$personId" as const,
      params: { personId: String(result.id) },
    }
  }

  if (scope === "company") {
    return {
      to: "/company/$companyId" as const,
      params: { companyId: String(result.id) },
    }
  }

  if (mediaType === "tv") {
    return {
      to: pathname.startsWith("/anime")
        ? ("/anime/$mediaId" as const)
        : ("/series/$mediaId" as const),
      params: { mediaId: String(result.id) },
    }
  }

  return {
    to: "/movie/$mediaId" as const,
    params: { mediaId: String(result.id) },
  }
}

function HeaderSearch({ className }: { className?: string }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const scope = useMemo(() => getSearchScope(pathname), [pathname])
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const endpoint = endpoints.search[scope]
  const placeholders = useMemo(
    () => getSearchPlaceholders(pathname, scope),
    [pathname, scope]
  )
  const placeholder = placeholders[placeholderIndex] ?? getSearchCopy(scope)

  useEffect(() => {
    if (query.trim().length > 0 || isFocused || placeholders.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length)
    }, 2200)

    return () => window.clearInterval(intervalId)
  }, [isFocused, placeholders, query])

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      return
    }

    const abortController = new AbortController()
    const timeout = window.setTimeout(async () => {
      setIsLoading(true)

      const response = await fetchApiData<SearchResponse>({
        endpoint: endpoint.api,
        method: endpoint.method,
        params: {
          query: trimmedQuery,
          language: "en-US",
          page: 1,
          include_adult: false,
        },
        signal: abortController.signal,
      })

      if (abortController.signal.aborted) {
        return
      }

      setResults(
        (response?.results ?? [])
          .filter((result) => {
            const mediaType = result.media_type ?? scope
            return (
              mediaType === "movie" ||
              mediaType === "tv" ||
              mediaType === "person" ||
              scope === "company"
            )
          })
          .slice(0, 6)
      )
      setIsLoading(false)
    }, 280)

    return () => {
      window.clearTimeout(timeout)
      abortController.abort()
    }
  }, [endpoint.api, endpoint.method, query, scope])

  const showResults = isFocused && query.trim().length >= 2

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/60"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          const nextQuery = event.target.value
          setQuery(nextQuery)

          if (nextQuery.trim().length < 2) {
            setResults([])
            setIsLoading(false)
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 160)
        }}
        className="h-9 border-[var(--header-control-border)] bg-[var(--header-control-bg)] pr-12 pl-9 text-white shadow-none placeholder:text-white/45 hover:border-white/20 hover:bg-[var(--header-control-hover-bg)] focus-visible:border-white/35 focus-visible:bg-[var(--header-control-hover-bg)] focus-visible:ring-white/15"
      />
      {!isFocused && !query && (
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-white/14 bg-white/8 px-1.5 py-0.5 text-[10px] font-medium text-white/40">
          /
        </kbd>
      )}
      {showResults && (
        <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-[70] overflow-hidden rounded-lg border border-white/12 bg-black/94 text-white shadow-2xl shadow-black/35 backdrop-blur-xl">
          <div className="border-b border-white/10 px-3 py-2 text-xs font-medium text-white/56">
            {isLoading ? "Searching..." : placeholder}
          </div>
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto p-1">
              {results.map((result) => {
                const route = getSearchRoute(result, scope, pathname)
                const image = getSearchImage(result, scope)

                return (
                  <Link
                    key={`${scope}-${result.id}-${result.media_type ?? "item"}`}
                    to={route.to}
                    params={route.params}
                    onClick={() => {
                      setQuery("")
                      setResults([])
                      setIsFocused(false)
                    }}
                    className="flex min-w-0 items-center gap-3 rounded-md p-2 transition hover:bg-white/10 focus:bg-white/10"
                  >
                    <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/10 text-white/62">
                      {image ? (
                        <img
                          src={image}
                          alt={getSearchTitle(result)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getSearchIcon(result, scope)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {getSearchTitle(result)}
                      </p>
                      <p className="truncate text-xs text-white/52">
                        {getSearchMeta(result, scope)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="px-3 py-4 text-sm text-white/52">
              {isLoading ? "Finding matches..." : "No results found."}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type LanguageComboboxProps = {
  languages: TmdbLanguage[]
  loading: boolean
  value?: string
  onChange: (value: string) => void
}

function LanguageCombobox({
  languages,
  loading,
  value,
  onChange,
}: LanguageComboboxProps) {
  const selectedLanguage = languages.find(
    (language) => language.iso_639_1 === value
  )

  return (
    <Combobox<TmdbLanguage>
      items={languages}
      value={selectedLanguage ?? null}
      onValueChange={(language) => {
        onChange(language?.iso_639_1 ?? "")
      }}
      itemToStringLabel={getLanguageLabel}
      itemToStringValue={(language) => language.iso_639_1}
      isItemEqualToValue={(item, selectedItem) =>
        item.iso_639_1 === selectedItem.iso_639_1
      }
      filter={matchesLanguage}
      limit={80}
      autoHighlight
      openOnInputClick
    >
      <ComboboxInput
        placeholder={loading ? "Loading languages..." : "Any language"}
        disabled={loading}
        showClear
        className="h-9 border-white/12 bg-white/8 text-white [&_input]:text-white [&_input]:placeholder:text-white/35 [&_button]:text-white/45 [&_button:hover]:bg-white/10 [&_button:hover]:text-white"
      />
      <ComboboxContent className="z-[90] border-white/10 bg-black/96 text-white shadow-2xl shadow-black/35 backdrop-blur-xl">
        <ComboboxEmpty className="text-white/48">No languages found.</ComboboxEmpty>
        <ComboboxList className="max-h-60">
          {(language: TmdbLanguage) => (
            <ComboboxItem
              key={language.iso_639_1}
              value={language}
              onClick={() => onChange(language.iso_639_1)}
              className="text-white/82 hover:bg-white/10 data-highlighted:bg-white/12 data-highlighted:text-white data-selected:text-white"
            >
              <span className="min-w-0 truncate">
                {getLanguageLabel(language)}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function HeaderFilters() {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  })
  const isCatalogRoute =
    pathname.startsWith("/movie") ||
    pathname.startsWith("/series") ||
    pathname.startsWith("/anime")
  const isMovieCatalogRoute = pathname.startsWith("/movie")
  const [languages, setLanguages] = useState<TmdbLanguage[]>([])
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false)

  const values = useMemo(() => getCatalogFilterSearch(search), [search])
  const activeCount = Object.keys(values).length

  useEffect(() => {
    if (!isCatalogRoute || languages.length > 0) {
      return
    }

    const abortController = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLoadingLanguages(true)

      const response = await fetchApiData<TmdbLanguage[]>({
        endpoint: endpoints.configuration.languages.api,
        method: endpoints.configuration.languages.method,
        signal: abortController.signal,
      })

      if (abortController.signal.aborted) {
        return
      }

      setLanguages(
        (response ?? [])
          .filter((language) => Boolean(language.iso_639_1))
          .sort(sortLanguages)
      )
      setIsLoadingLanguages(false)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      abortController.abort()
    }
  }, [isCatalogRoute, languages.length])

  const updateFilter = (key: CatalogFilterKey, value: string) => {
    const nextSearch = { ...search }

    if (value) {
      nextSearch[key] = value
    } else {
      delete nextSearch[key]
    }

    void navigate({ to: pathname, search: nextSearch } as never)
  }

  const clearFilters = () => {
    void navigate({
      to: pathname,
      search: clearCatalogFilterSearch(search),
    } as never)
  }

  if (!isCatalogRoute) {
    return null
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[var(--header-control-border)] bg-[var(--header-control-bg)] text-white hover:border-white/20 hover:bg-[var(--header-control-hover-bg)] hover:text-white"
          aria-label="Open catalog filters"
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-white/18 px-1.5 text-[0.68rem] leading-5 text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 border-white/10 bg-black/94 p-3 text-white shadow-2xl shadow-black/35 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <DropdownMenuLabel className="px-0 py-0 text-white/62">
            Catalog filters
          </DropdownMenuLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-white/62 hover:bg-white/10 hover:text-white"
            onClick={clearFilters}
            disabled={activeCount === 0}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <div className="grid gap-3 py-1">
          {isMovieCatalogRoute && (
            <div className="grid gap-1.5 text-xs text-white/60">
              Release status
              <div className="grid grid-cols-3 rounded-lg border border-white/12 bg-white/8 p-1">
                {movieReleaseTabs.map((tab) => {
                  const isActive =
                    (values.movie_release_status ?? "all") === tab.value

                  return (
                    <button
                      key={tab.value}
                      type="button"
                      className={cn(
                        "h-8 rounded-md px-1 text-[0.72rem] font-medium text-white/58 transition hover:bg-white/10 hover:text-white",
                        isActive &&
                          "bg-white text-black shadow-sm hover:bg-white hover:text-black"
                      )}
                      onClick={() =>
                        updateFilter(
                          "movie_release_status",
                          tab.value === "all" ? "" : tab.value
                        )
                      }
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <label className="grid gap-1.5 text-xs text-white/60">
            Original language
            <LanguageCombobox
              languages={languages}
              loading={isLoadingLanguages}
              value={values.with_original_language ?? "all"}
              onChange={(value) =>
                updateFilter(
                  "with_original_language",
                  value === "all" ? "" : value
                )
              }
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-xs text-white/60">
              Release year
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="2024"
                value={values.primary_release_year ?? ""}
                onChange={(event) =>
                  updateFilter(
                    "primary_release_year",
                    event.target.value.replace(/\D/g, "").slice(0, 4)
                  )
                }
                className="h-9 border-white/12 bg-white/8 text-white placeholder:text-white/35"
              />
            </label>
            <label className="grid gap-1.5 text-xs text-white/60">
              Released after
              <Input
                type="date"
                value={values["release_date.gte"] ?? ""}
                onChange={(event) =>
                  updateFilter("release_date.gte", event.target.value)
                }
                className="h-9 border-white/12 bg-white/8 text-white"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5 text-xs text-white/60">
            Minimum rating
            <div className="flex items-center gap-3">
              <Slider
                value={[Number(values["vote_average.gte"] ?? 0)]}
                onValueChange={([value]) =>
                  updateFilter(
                    "vote_average.gte",
                    value > 0 ? String(value) : ""
                  )
                }
                min={0}
                max={9}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-right text-sm font-medium text-white/80">
                {values["vote_average.gte"] ?? "0"}+
              </span>
            </div>
          </div>
            <label className="grid gap-1.5 text-xs text-white/60">
              Genre
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-white/12 bg-white/8 px-3 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    {values.with_genres
                      ? genreOptions.find((g) => g.value === values.with_genres)
                          ?.label ?? "Select genre"
                      : "Any genre"}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-56 border-white/10 bg-black/96 p-3 text-white shadow-2xl backdrop-blur-xl"
                >
                  <div className="space-y-2">
                    {genreOptions.map((genre) => (
                      <label
                        key={genre.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/80 transition hover:bg-white/10"
                      >
                        <Checkbox
                          checked={values.with_genres === genre.value}
                          onCheckedChange={(checked) =>
                            updateFilter(
                              "with_genres",
                              checked ? genre.value : ""
                            )
                          }
                        />
                        {genre.label}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </label>
          </div>

          <div className="grid gap-1.5 text-xs text-white/60">
            Sort by
            <RadioGroup
              value={values.sort_by ?? "all"}
              onValueChange={(value) =>
                updateFilter("sort_by", value === "all" ? "" : value)
              }
              className="flex flex-wrap gap-2"
            >
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/12 bg-white/8 px-2.5 py-1.5 text-[0.72rem] text-white/58 transition hover:bg-white/10 has-[[data-state=checked]]:border-white/25 has-[[data-state=checked]]:bg-white/14 has-[[data-state=checked]]:text-white">
                <RadioGroupItem value="all" className="sr-only" />
                Default
              </label>
              {endpoints.filters.sort_by.map((sortOption) => (
                <label
                  key={sortOption.value}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/12 bg-white/8 px-2.5 py-1.5 text-[0.72rem] text-white/58 transition hover:bg-white/10 has-[[data-state=checked]]:border-white/25 has-[[data-state=checked]]:bg-white/14 has-[[data-state=checked]]:text-white"
                >
                  <RadioGroupItem value={sortOption.value} className="sr-only" />
                  {sortOption.label}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function HeaderLayout() {
  const navigate = useNavigate()
  const [hasScrolled, setHasScrolled] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() =>
    getSessionUser()
  )
  const breadcrumbItems = useBreadcrumbItems()

  const handleLogout = async () => {
    const accessToken = sessionStorage.getItem("access_token")
    const currentUser = getSessionUser()
    const userId = currentUser?._id ?? currentUser?.id

    if (accessToken && userId) {
      await backendApiData({
        method: "POST",
        url: backendEndpoints.auth.revoke,
        payload: {
          access_token: accessToken,
          user_id: userId,
        },
      })
    }

    clearAuthSession()
    setSessionUser(null)
    toast.success("Logged out successfully.")
    await navigate({ to: "/sign-in" })
  }

  useEffect(() => {
    let animationFrameId = 0

    const handleScroll = () => {
      if (animationFrameId) {
        return
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0
        const nextHasScrolled = window.scrollY > 12

        setHasScrolled((currentValue) =>
          currentValue === nextHasScrolled ? currentValue : nextHasScrolled
        )
      })
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }

      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 text-white transition-all duration-300",
        hasScrolled
          ? "border-b border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
          : "border-0 bg-transparent shadow-none backdrop-blur-none"
      )}
      style={
        {
          backgroundColor: hasScrolled
            ? "rgba(0, 0, 0, 0.88)"
            : "rgba(0, 0, 0, 0.28)",
          borderColor: hasScrolled
            ? "rgba(255, 255, 255, 0.14)"
            : "transparent",
          "--header-control-bg": hasScrolled
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.18)",
          "--header-control-hover-bg": hasScrolled
            ? "rgba(255, 255, 255, 0.14)"
            : "rgba(0, 0, 0, 0.26)",
          "--header-control-border": hasScrolled
            ? "rgba(255, 255, 255, 0.16)"
            : "rgba(255, 255, 255, 0.12)",
        } as CSSProperties
      }
    >
      <div className="mx-auto flex min-h-20 w-full min-w-0 flex-col justify-center gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/home" className="flex shrink-0 items-center gap-3">
            <img
              src="/assets/quantum_clap_logo.png"
              alt="Quantum Clap"
              className="h-9 w-9 rounded-md border border-[var(--header-control-border)] object-cover"
            />
            <div className="flex items-center gap-2">
              <span className="[font-family:'Cinzel',_'Trajan_Pro',_'Times_New_Roman',_serif] font-semibold tracking-[0.08em] text-white">
                Quantum Clap
              </span>
              <span className="text-white/30">/</span>
              <span className="text-white/55">Media</span>
            </div>
          </Link>

          <Breadcrumb className="hidden min-w-0 items-center text-sm text-white/45 md:flex">
            <BreadcrumbList className="min-w-0 flex-nowrap gap-1 text-white/45">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="hover:text-white">
                  <Link to="/home">Quantum Clap</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1

                return (
                  <Fragment key={item.to}>
                    <BreadcrumbSeparator className="text-white/25" />
                    <BreadcrumbItem className="min-w-0 flex-nowrap gap-1">
                      {isLast ? (
                        <BreadcrumbPage className="truncate font-medium text-white">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="truncate hover:text-white"
                        >
                          <Link to={item.to}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
          <div className="min-w-0 text-sm font-medium text-white md:hidden">
            {breadcrumbItems.at(-1)?.label ?? "Home"}
          </div>

          <HeaderSearch className="hidden w-64 shrink-0 md:block xl:w-80" />
          <HeaderFilters />

          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 border-[var(--header-control-border)] bg-[var(--header-control-bg)] text-white hover:border-white/20 hover:bg-[var(--header-control-hover-bg)] md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-white/10 bg-black/96 p-0 text-white backdrop-blur-xl"
            >
              <SheetHeader className="border-b border-white/10 px-5 py-4">
                <SheetTitle className="text-left text-white">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/home" }}
                    activeProps={{
                      className:
                        "bg-white/10 font-medium text-white",
                    }}
                    className="rounded-lg px-4 py-3 text-sm text-white/70 transition hover:bg-white/8 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-white/10" />
                <Link
                  to="/profile"
                  className="rounded-lg px-4 py-3 text-sm text-white/70 transition hover:bg-white/8 hover:text-white"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="rounded-lg px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/12 hover:text-red-200"
                  onClick={() => {
                    void handleLogout()
                  }}
                >
                  Logout
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <NavigationMenu
            viewport={false}
            className="max-w-full min-w-0 [&_[data-slot=navigation-menu-indicator]>div]:!bg-white/15"
          >
            <NavigationMenuList className="max-w-[calc(100vw-1.5rem)] gap-1 overflow-visible rounded-md border border-[var(--header-control-border)] bg-[var(--header-control-bg)] p-1 shadow-inner sm:max-w-none">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.to}>
                  <NavigationMenuLink
                    asChild
                    className="rounded-md border border-transparent px-2.5 py-2 text-xs text-white/68 transition-colors hover:border-white/10 hover:bg-white/[0.08] hover:text-white focus:border-white/10 focus:bg-white/[0.08] focus:text-white sm:px-3 sm:text-sm"
                  >
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === "/home" }}
                      activeProps={{
                        className:
                          "rounded-md border border-white/14 bg-white/[0.13] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
                      }}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
            <NavigationMenuIndicator />
          </NavigationMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open account menu"
                className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--header-control-border)] bg-[var(--header-control-bg)] text-sm font-semibold text-white shadow-inner transition hover:border-white/25 hover:bg-[var(--header-control-hover-bg)] focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
              >
                <Avatar className="size-full border-0 bg-transparent">
                  <AvatarFallback className="bg-gradient-to-br from-white/22 to-white/6 text-xs font-semibold text-white">
                    {getUserInitials(sessionUser)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 border-white/10 bg-black/92 p-1.5 text-white shadow-2xl shadow-black/35 backdrop-blur-xl"
            >
              <DropdownMenuLabel className="px-2 py-2 text-white/55">
                Account
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="cursor-pointer px-2 py-2">
                <Link to="/profile">
                  <UserRound className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm text-red-300 outline-none transition hover:bg-red-500/12 focus:bg-red-500/12 focus:text-red-200"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-white/10 bg-black/96 text-white shadow-2xl backdrop-blur-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm logout</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/56">
                      You will be signed out of your Quantum Clap session.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/14 bg-transparent text-white hover:bg-white/10 hover:text-white">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500/90 text-white hover:bg-red-500"
                      onClick={() => {
                        void handleLogout()
                      }}
                    >
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <HeaderSearch className="block w-full md:hidden" />
      </div>
    </header>
  )
}
