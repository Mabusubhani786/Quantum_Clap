import { Fragment, useEffect, useState, type CSSProperties } from "react"
import { Search } from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"

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
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  to: "/home" | "/movie" | "/series"
}

const navItems: NavItem[] = [
  { label: "Home", to: "/home" },
  { label: "Movies", to: "/movie" },
  { label: "Series", to: "/series" },
]

const animeMenuItems = [
  { label: "Movies", to: "/anime" },
  { label: "Series", to: "/anime" },
]

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

function HeaderSearch({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-primary-foreground/50"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Search movies, series, anime"
        aria-label="Search movies, series, anime"
        className="h-9 border-[var(--header-control-border)] bg-[var(--header-control-bg)] pr-3 pl-9 text-primary-foreground shadow-none placeholder:text-primary-foreground/40 hover:border-white/20 hover:bg-[var(--header-control-hover-bg)] focus-visible:border-white/35 focus-visible:bg-[var(--header-control-hover-bg)] focus-visible:ring-white/15"
      />
    </div>
  )
}

export function HeaderLayout() {
  const [hasScrolled, setHasScrolled] = useState(false)
  const breadcrumbItems = useBreadcrumbItems()
  const isAnimeActive = useRouterState({
    select: (state) => state.location.pathname.startsWith("/anime"),
  })

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
        "sticky top-0 z-50 text-primary-foreground transition-all duration-300",
        hasScrolled
          ? "border-b border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.04),0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
          : "border-b border-white/0 shadow-none backdrop-blur-[2px]"
      )}
      style={{
        backgroundColor: hasScrolled
          ? "rgba(var(--hero-accent-color, 5, 5, 5), 0.78)"
          : "rgba(var(--hero-accent-color, 5, 5, 5), 0.2)",
        borderColor: hasScrolled
          ? "rgba(var(--hero-accent-color, 5, 5, 5), 0.42)"
          : "rgba(var(--hero-accent-color, 5, 5, 5), 0.18)",
        "--header-control-bg": hasScrolled
          ? "rgba(var(--hero-accent-color, 5, 5, 5), 0.36)"
          : "rgba(var(--hero-accent-color, 5, 5, 5), 0.22)",
        "--header-control-hover-bg":
          "rgba(var(--hero-accent-color, 5, 5, 5), 0.46)",
        "--header-control-border":
          "rgba(var(--hero-accent-color, 5, 5, 5), 0.5)",
      } as CSSProperties}
    >
      <div className="mx-auto flex min-h-20 w-full min-w-0 flex-col justify-center gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/home" className="flex shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--header-control-border)] bg-[var(--header-control-bg)] text-sm font-bold text-primary-foreground shadow-inner">
              V
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-wide text-white">
                Vexto
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
                  <Link to="/home">Vexto</Link>
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
            <NavigationMenuList className="max-w-[calc(100vw-1.5rem)] gap-1 overflow-x-auto overflow-y-visible rounded-md border border-[var(--header-control-border)] bg-[var(--header-control-bg)] p-1 shadow-inner [scrollbar-width:none] sm:max-w-none">
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
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "h-auto rounded-md border border-transparent bg-transparent px-2.5 py-2 text-xs font-normal text-white/68 hover:border-white/10 hover:bg-white/[0.08] hover:text-white focus:border-white/10 focus:bg-white/[0.08] focus:text-white data-popup-open:!border-white/10 data-popup-open:!bg-white/[0.08] data-popup-open:!text-white data-open:!border-white/10 data-open:!bg-white/[0.08] data-open:!text-white sm:px-3 sm:text-sm",
                    isAnimeActive &&
                      "!border-white/14 !bg-white/[0.13] font-medium !text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  )}
                >
                  Anime
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!right-0 !left-auto z-50 !rounded-md !border !border-[var(--header-control-border)] !bg-[rgba(var(--hero-accent-color,5,5,5),0.92)] !text-white shadow-xl shadow-black/30 !ring-white/10">
                  <div className="grid w-48 gap-1 p-1">
                    {animeMenuItems.map((item) => (
                      <NavigationMenuLink
                        key={item.label}
                        asChild
                        className="rounded-md border border-transparent px-3 py-2 text-sm text-white/72 hover:border-white/10 hover:bg-white/[0.08] hover:text-white focus:border-white/10 focus:bg-white/[0.08] focus:text-white"
                      >
                        <Link to={item.to}>{item.label}</Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
            <NavigationMenuIndicator />
          </NavigationMenu>
        </div>

        <HeaderSearch className="block w-full md:hidden" />
      </div>
    </header>
  )
}
