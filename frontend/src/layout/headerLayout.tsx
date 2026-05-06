import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react"
import { Building2, Film, Search, Tv, UserRound } from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuIndicator,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { fetchApiData } from "@/service/fetchApiData"

type EndpointConfig = {
  method: "GET"
  api: string
}

type ApiEndpoints = {
  search: {
    movie: EndpointConfig
    tv: EndpointConfig
    person: EndpointConfig
    company: EndpointConfig
    multi: EndpointConfig
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

type NavItem = {
  label: string
  to: "/home" | "/movie" | "/series" | "/anime"
}

const navItems: NavItem[] = [
  { label: "Home", to: "/home" },
  { label: "Movies", to: "/movie" },
  { label: "Series", to: "/series" },
  { label: "Anime", to: "/anime" },
]

const endpoints = apiEndPoints as ApiEndpoints

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
  const endpoint = endpoints.search[scope]
  const placeholder = pathname.startsWith("/anime")
    ? "Search anime"
    : getSearchCopy(scope)

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
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-primary-foreground/50"
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
        className="h-9 border-[var(--header-control-border)] bg-[var(--header-control-bg)] pr-3 pl-9 text-primary-foreground shadow-none placeholder:text-primary-foreground/40 hover:border-white/20 hover:bg-[var(--header-control-hover-bg)] focus-visible:border-white/35 focus-visible:bg-[var(--header-control-hover-bg)] focus-visible:ring-white/15"
      />
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

export function HeaderLayout() {
  const [hasScrolled, setHasScrolled] = useState(false)
  const breadcrumbItems = useBreadcrumbItems()

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 12)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 text-primary-foreground transition-all duration-300",
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
                <BreadcrumbLink
                  asChild
                  className="hover:text-primary-foreground"
                >
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
                        <BreadcrumbPage className="truncate font-medium text-primary-foreground">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="truncate hover:text-primary-foreground"
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
          <div className="min-w-0 text-sm font-medium text-primary-foreground md:hidden">
            {breadcrumbItems.at(-1)?.label ?? "Home"}
          </div>

          <HeaderSearch className="hidden w-64 shrink-0 md:block xl:w-80" />

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
        </div>

        <HeaderSearch className="block w-full md:hidden" />
      </div>
    </header>
  )
}
