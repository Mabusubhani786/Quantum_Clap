import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Building2,
  CalendarDays,
  ExternalLink,
  Film,
  Globe2,
  ImageIcon,
  MapPin,
  Star,
} from "lucide-react"
import { Link } from "@tanstack/react-router"

import { EmptyState } from "@/components/EmptyState"
import TiltedCard from "@/components/TiltedCard"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Skeleton } from "@/components/ui/skeleton"
import { WatchListButton } from "@/components/WatchListButton"
import { fetchApiData } from "@/service/fetchApiData"

type EndpointConfig = {
  method: "GET"
  api: string
}

type PersonDetailPageProps = {
  id: string
  detailEndpoint: EndpointConfig
}

type CompanyDetailPageProps = {
  id: string
  detailEndpoint: EndpointConfig
  imagesEndpoint: EndpointConfig
  alternativeNamesEndpoint: EndpointConfig
}

type PersonDetail = {
  id: number
  name: string
  biography?: string
  birthday?: string | null
  deathday?: string | null
  place_of_birth?: string | null
  known_for_department?: string
  profile_path: string | null
  homepage?: string | null
  popularity?: number
  combined_credits?: {
    cast?: PersonCredit[]
    crew?: PersonCredit[]
  }
  images?: {
    profiles?: Array<{
      file_path: string
      vote_average?: number
    }>
  }
}

type PersonCredit = {
  id: number
  title?: string
  name?: string
  media_type?: "movie" | "tv"
  poster_path: string | null
  backdrop_path: string | null
  character?: string
  job?: string
  release_date?: string
  first_air_date?: string
  vote_average?: number
}

type CompanyDetail = {
  id: number
  name: string
  description?: string
  headquarters?: string
  homepage?: string
  logo_path: string | null
  origin_country?: string
  parent_company?: {
    id: number
    name: string
    logo_path: string | null
  } | null
}

type CompanyImages = {
  logos?: Array<{
    file_path: string
    vote_average?: number
  }>
}

type CompanyAlternativeNames = {
  results?: Array<{
    name: string
    type?: string
  }>
}

const imageBaseUrl = "https://image.tmdb.org/t/p/"

function resolveEndpoint(endpoint: string, id: string) {
  return endpoint.replace("{person_id}", id).replace("{company_id}", id)
}

function getProfileUrl(path: string | null, size = "h632") {
  return path
    ? `${imageBaseUrl}${size}${path}`
    : "https://placehold.co/632x948/111111/fafafa?text=No+Image"
}

function getPosterUrl(path: string | null) {
  return path
    ? `${imageBaseUrl}w342${path}`
    : "https://placehold.co/342x513/111111/fafafa?text=No+Poster"
}

function getBackdropUrl(path: string | null) {
  return path ? `${imageBaseUrl}original${path}` : undefined
}

function getLogoUrl(path: string | null) {
  return path
    ? `${imageBaseUrl}w500${path}`
    : "https://placehold.co/500x300/111111/fafafa?text=No+Logo"
}

function formatDate(value?: string | null) {
  if (!value) {
    return "TBA"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "TBA"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getCreditTitle(item: PersonCredit) {
  return item.title ?? item.name ?? "Untitled"
}

function getCreditYear(item: PersonCredit) {
  const date = item.release_date ?? item.first_air_date

  if (!date) {
    return "TBA"
  }

  return new Date(date).getFullYear().toString()
}

function getCreditRoute(item: PersonCredit) {
  return item.media_type === "tv" ? "/series/$mediaId" : "/movie/$mediaId"
}

function EntitySkeleton() {
  return (
    <section className="space-y-6 py-6">
      <div className="min-h-[34rem] rounded-lg bg-muted p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
        <Skeleton className="mt-2 h-5 w-3/4 max-w-xl" />
      </div>
      <Skeleton className="h-56 w-full rounded-lg" />
    </section>
  )
}

export function PersonDetailPage({ id, detailEndpoint }: PersonDetailPageProps) {
  const [detail, setDetail] = useState<PersonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const endpoint = useMemo(
    () => resolveEndpoint(detailEndpoint.api, id),
    [detailEndpoint.api, id]
  )

  useEffect(() => {
    const abortController = new AbortController()

    async function loadPerson() {
      setLoading(true)
      setError(false)

      const response = await fetchApiData<PersonDetail>({
        endpoint,
        method: detailEndpoint.method,
        params: {
          language: "en-US",
          append_to_response: "combined_credits,images,external_ids",
        },
        signal: abortController.signal,
      })

      if (abortController.signal.aborted) {
        return
      }

      setDetail(response)
      setError(!response)
      setLoading(false)
    }

    void loadPerson()

    return () => abortController.abort()
  }, [detailEndpoint.method, endpoint])

  if (loading) {
    return <EntitySkeleton />
  }

  if (error || !detail) {
    return <EntityError label="person" />
  }

  const actingCredits = detail.combined_credits?.cast?.slice(0, 28) ?? []
  const crewCredits = detail.combined_credits?.crew?.slice(0, 28) ?? []
  const imageProfiles = detail.images?.profiles?.slice(0, 18) ?? []

  return (
    <section className="space-y-6 pb-6">
      <EntityHero
        title={detail.name}
        eyebrow="Person"
        imageUrl={getProfileUrl(detail.profile_path, "h632")}
        posterUrl={getProfileUrl(detail.profile_path, "w342")}
        description={detail.biography || "Biography is not available yet."}
        badges={[
          detail.known_for_department ?? "Known for TBA",
          detail.place_of_birth ?? "Birthplace TBA",
        ]}
        homepage={detail.homepage}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Biography</CardTitle>
            <CardDescription>Profile information from TMDB</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              {detail.biography || "Biography is not available yet."}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Personal profile data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Born" value={formatDate(detail.birthday)} />
            <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Died" value={formatDate(detail.deathday)} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Place" value={detail.place_of_birth ?? "TBA"} />
            <InfoRow icon={<Film className="h-4 w-4" />} label="Department" value={detail.known_for_department ?? "TBA"} />
            <InfoRow icon={<Star className="h-4 w-4" />} label="Popularity" value={detail.popularity ? detail.popularity.toFixed(1) : "NR"} />
          </CardContent>
        </Card>
      </div>

      <CreditRail title="Known For" description="Acting and appearance credits" items={actingCredits} />
      <CreditRail title="Crew Work" description="Production and creative credits" items={crewCredits} />
      <ImageRail title="Profile Images" images={imageProfiles} kind="profile" />
    </section>
  )
}

export function CompanyDetailPage({
  id,
  detailEndpoint,
  imagesEndpoint,
  alternativeNamesEndpoint,
}: CompanyDetailPageProps) {
  const [detail, setDetail] = useState<CompanyDetail | null>(null)
  const [images, setImages] = useState<CompanyImages | null>(null)
  const [alternativeNames, setAlternativeNames] =
    useState<CompanyAlternativeNames | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const detailUrl = useMemo(
    () => resolveEndpoint(detailEndpoint.api, id),
    [detailEndpoint.api, id]
  )
  const imagesUrl = useMemo(
    () => resolveEndpoint(imagesEndpoint.api, id),
    [id, imagesEndpoint.api]
  )
  const namesUrl = useMemo(
    () => resolveEndpoint(alternativeNamesEndpoint.api, id),
    [alternativeNamesEndpoint.api, id]
  )

  useEffect(() => {
    const abortController = new AbortController()

    async function loadCompany() {
      setLoading(true)
      setError(false)

      const [detailResponse, imagesResponse, namesResponse] = await Promise.all([
        fetchApiData<CompanyDetail>({
          endpoint: detailUrl,
          method: detailEndpoint.method,
          signal: abortController.signal,
        }),
        fetchApiData<CompanyImages>({
          endpoint: imagesUrl,
          method: imagesEndpoint.method,
          signal: abortController.signal,
        }),
        fetchApiData<CompanyAlternativeNames>({
          endpoint: namesUrl,
          method: alternativeNamesEndpoint.method,
          signal: abortController.signal,
        }),
      ])

      if (abortController.signal.aborted) {
        return
      }

      setDetail(detailResponse)
      setImages(imagesResponse)
      setAlternativeNames(namesResponse)
      setError(!detailResponse)
      setLoading(false)
    }

    void loadCompany()

    return () => abortController.abort()
  }, [
    alternativeNamesEndpoint.method,
    detailEndpoint.method,
    detailUrl,
    imagesEndpoint.method,
    imagesUrl,
    namesUrl,
  ])

  if (loading) {
    return <EntitySkeleton />
  }

  if (error || !detail) {
    return <EntityError label="company" />
  }

  const logos = images?.logos?.slice(0, 24) ?? []
  const logoUrl = getLogoUrl(detail.logo_path)

  return (
    <section className="space-y-6 pb-6">
      <EntityHero
        title={detail.name}
        eyebrow="Production Company"
        imageUrl={logoUrl}
        posterUrl={logoUrl}
        description={
          detail.description ||
          "Company description is not available yet from TMDB."
        }
        badges={[
          detail.origin_country || "Country TBA",
          detail.headquarters || "Headquarters TBA",
        ]}
        homepage={detail.homepage}
        containPoster
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Production company details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              {detail.description ||
                "Company description is not available yet from TMDB."}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Company metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Name" value={detail.name} />
            <InfoRow icon={<Globe2 className="h-4 w-4" />} label="Country" value={detail.origin_country || "TBA"} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Headquarters" value={detail.headquarters || "TBA"} />
            {detail.parent_company && (
              <InfoRow
                icon={<Building2 className="h-4 w-4" />}
                label="Parent"
                value={detail.parent_company.name}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ImageRail title="Company Images" images={logos} kind="logo" />
      <AlternativeNamesSection names={alternativeNames?.results ?? []} />
    </section>
  )
}

function EntityHero({
  title,
  eyebrow,
  imageUrl,
  posterUrl,
  description,
  badges,
  homepage,
  containPoster,
}: {
  title: string
  eyebrow: string
  imageUrl: string
  posterUrl: string
  description: string
  badges: string[]
  homepage?: string | null
  containPoster?: boolean
}) {
  return (
    <section className="relative -mx-2 -mt-6 isolate min-h-[min(48rem,100svh)] overflow-hidden bg-black text-white sm:-mx-3 lg:min-h-[34rem]">
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover opacity-45 blur-sm"
      />
      <div className="absolute inset-0 -z-10 bg-black/62" />
      <div className="flex min-h-[min(48rem,100svh)] items-end px-5 pt-52 pb-10 sm:px-5 sm:pt-40 lg:min-h-[34rem] lg:px-4 lg:pt-28 lg:pb-12">
        <div className="grid w-full grid-cols-[6.5rem_minmax(0,1fr)] items-end gap-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6">
          <div className="overflow-hidden rounded-lg border border-white/12 bg-white/8 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-2">
            <img
              src={posterUrl}
              alt={title}
              className={
                containPoster
                  ? "h-32 w-full rounded-md object-contain p-3 sm:h-52 sm:p-5 lg:h-72 lg:p-6"
                  : "h-32 w-full rounded-md object-cover object-top sm:h-52 lg:h-72"
              }
            />
          </div>
          <div className="min-w-0 max-w-4xl space-y-3 sm:space-y-4 lg:space-y-5">
            <Badge className="rounded-md bg-white/12 text-xs text-white hover:bg-white/12 sm:text-sm">
              {eyebrow}
            </Badge>
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-[clamp(2.1rem,10vw,4rem)] font-bold leading-[0.96] sm:text-5xl lg:text-6xl lg:leading-tight">
                {title}
              </h1>
              <p className="line-clamp-3 max-w-3xl text-sm leading-6 text-white/76 sm:text-base sm:leading-7 lg:line-clamp-4 lg:text-lg">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {badges.map((badge) => (
                <Badge
                  key={badge}
                  variant="secondary"
                  className="max-w-full truncate rounded-md text-xs sm:text-sm"
                >
                  {badge}
                </Badge>
              ))}
            </div>
            {homepage && (
              <a
                href={homepage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black hover:bg-white/90"
              >
                <ExternalLink className="h-4 w-4" />
                Official site
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="max-w-[12rem] text-right font-medium">{value}</span>
    </div>
  )
}

function CreditRail({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: PersonCredit[]
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {items.map((item, index) => (
                <CarouselItem key={`${item.media_type}-${item.id}-${index}`} className="basis-auto pl-3">
                  <div className="group relative block w-[11rem] sm:w-[12rem]">
                    <Link
                      aria-label={`Open ${getCreditTitle(item)}`}
                      to={getCreditRoute(item)}
                      params={{ mediaId: String(item.id) }}
                      className="absolute inset-0 z-10 rounded-lg"
                    />
                    <div className="absolute top-2 right-2 z-30">
                      <WatchListButton
                        item={{
                          media_id: item.id,
                          media_type:
                            item.media_type === "tv" ? "tv" : "movie",
                          title: getCreditTitle(item),
                          poster_url: getPosterUrl(item.poster_path),
                          background_image_url: getBackdropUrl(
                            item.backdrop_path
                          ),
                          metadata: {
                            role: item.character || item.job,
                            rating: item.vote_average,
                            release_year: getCreditYear(item),
                          },
                        }}
                      />
                    </div>
                    <div className="h-[25rem] overflow-hidden rounded-lg border bg-card transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg sm:h-[26rem]">
                      <div className="relative h-[16.5rem] sm:h-[18rem]">
                        <TiltedCard
                          imageSrc={getPosterUrl(item.poster_path)}
                          altText={getCreditTitle(item)}
                          containerHeight="100%"
                          containerWidth="100%"
                          imageHeight="100%"
                          imageWidth="100%"
                          scaleOnHover={1.05}
                          rotateAmplitude={8}
                          showMobileWarning={false}
                          showTooltip={false}
                        />
                      </div>
                      <div className="space-y-2 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="rounded-md text-xs">
                            {item.media_type === "tv" ? "Series" : "Movie"}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {item.vote_average ? item.vote_average.toFixed(1) : "NR"}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm font-semibold">
                          {getCreditTitle(item)}
                        </p>
                        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {item.character || item.job || getCreditYear(item)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-3 flex justify-end gap-2">
              <CarouselPrevious className="static translate-0 rounded-md" />
              <CarouselNext className="static translate-0 rounded-md" />
            </div>
          </Carousel>
        ) : (
          <EmptyState
            compact
            title="No data is available"
            description="Credit details are not available yet."
          />
        )}
      </CardContent>
    </Card>
  )
}

function ImageRail({
  title,
  images,
  kind,
}: {
  title: string
  images: Array<{ file_path: string; vote_average?: number }>
  kind: "profile" | "logo"
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>Images returned from the TMDB detail APIs</CardDescription>
      </CardHeader>
      <CardContent>
        {images.length > 0 ? (
          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {images.map((image) => (
                <CarouselItem key={image.file_path} className="basis-auto pl-3">
                  <div className={kind === "logo" ? "flex h-40 w-64 items-center justify-center rounded-lg border bg-card p-5" : "h-64 w-44 overflow-hidden rounded-lg border bg-card"}>
                    <img
                      src={`${imageBaseUrl}${kind === "logo" ? "w500" : "h632"}${image.file_path}`}
                      alt={title}
                      className={kind === "logo" ? "max-h-full max-w-full object-contain" : "h-full w-full object-cover"}
                      loading="lazy"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-3 flex justify-end gap-2">
              <CarouselPrevious className="static translate-0 rounded-md" />
              <CarouselNext className="static translate-0 rounded-md" />
            </div>
          </Carousel>
        ) : (
          <EmptyState
            compact
            title="No data is available"
            description="Images are not available yet."
          />
        )}
      </CardContent>
    </Card>
  )
}

function AlternativeNamesSection({
  names,
}: {
  names: Array<{ name: string; type?: string }>
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Alternative Names</CardTitle>
        <CardDescription>Known company names and regional variants</CardDescription>
      </CardHeader>
      <CardContent>
        {names.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {names.map((name, index) => (
              <Badge key={`${name.name}-${index}`} variant="secondary" className="rounded-md">
                {name.name}
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            title="No data is available"
            description="Alternative names are not available yet."
          />
        )}
      </CardContent>
    </Card>
  )
}

function EntityError({ label }: { label: string }) {
  return (
    <EmptyState
      className="my-6"
      title="No data is available"
      description={`We could not load this ${label} from TMDB right now.`}
    />
  )
}
