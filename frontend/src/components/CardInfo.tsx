import { CalendarDays, Star } from "lucide-react"
import { Link } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"
import {
  WatchListButton,
  type WatchListMediaInput,
} from "@/components/WatchListButton"
import { cn } from "@/lib/utils"

type CardInfoProps = {
  posterImage: string
  backdropImage: string
  imageAlt: string
  title: string
  mediaType: string
  description: string
  genres?: string[]
  rating?: string
  releaseDate?: string
  detailTo?: string
  watchListItem?: WatchListMediaInput
  className?: string
}

export function CardInfo({
  posterImage,
  backdropImage,
  imageAlt,
  title,
  mediaType,
  description,
  genres = [],
  rating,
  releaseDate,
  detailTo,
  watchListItem,
  className,
}: CardInfoProps) {
  const card = (
    <Card
      className={cn(
        "relative isolate @container/card-info h-full overflow-hidden rounded-lg border-white/10 bg-[#050505] bg-cover bg-center py-0 text-white shadow-xl shadow-black/20 ring-white/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30",
        className
      )}
      style={{ backgroundImage: `url(${backdropImage})` }}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/75 to-black/35" />
      <div className="absolute inset-0 -z-10 bg-black/20" />
      {watchListItem && (
        <div className="absolute top-3 right-3 z-20">
          <WatchListButton item={watchListItem} />
        </div>
      )}

      <CardContent className="grid gap-3 p-3 @[28rem]/card-info:grid-cols-[7.25rem_1fr] @[42rem]/card-info:grid-cols-[8.5rem_1fr] @[58rem]/card-info:grid-cols-[10rem_1fr] @[28rem]/card-info:p-4">
        <CardContainer
          containerClassName="w-full justify-start py-0"
          className="w-full"
        >
          <CardBody className="h-auto w-full">
            <CardItem
              translateZ={45}
              className="aspect-[2/3] w-full overflow-hidden rounded-md bg-white/10 shadow-2xl shadow-black/40"
            >
              <img
                src={posterImage}
                alt={imageAlt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </CardItem>
          </CardBody>
        </CardContainer>

        <div className="flex min-w-0 flex-col justify-center gap-3 py-1 sm:py-2">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-xl leading-tight font-bold @[42rem]/card-info:text-2xl">
              {title}
            </h3>
            <Badge className="border-white/10 bg-white/12 px-2.5 py-1 text-xs text-white hover:bg-white/16 @[42rem]/card-info:text-sm">
              {mediaType}
            </Badge>
          </div>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="min-w-0 border border-lime-700 bg-white/80 px-2.5 py-1 text-center text-xs font-medium text-black hover:bg-white/90 @[42rem]/card-info:min-w-20 @[42rem]/card-info:text-sm"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          <p className="line-clamp-3 max-w-3xl text-sm leading-6 text-white/95 @[42rem]/card-info:text-base @[42rem]/card-info:leading-7">
            {description}
          </p>

          {(rating || releaseDate) && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-white @[42rem]/card-info:gap-3 @[42rem]/card-info:text-base">
              {rating && (
                <span className="inline-flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300 @[42rem]/card-info:h-5 @[42rem]/card-info:w-5" />
                  {rating}
                </span>
              )}
              {rating && releaseDate && (
                <span className="text-white/55">|</span>
              )}
              {releaseDate && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-white/75 @[42rem]/card-info:h-5 @[42rem]/card-info:w-5" />
                  {releaseDate}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (!detailTo) {
    return card
  }

  return (
    <div className="relative block h-full min-w-0">
      <Link
        aria-label={`Open ${title}`}
        to={detailTo}
        className="absolute inset-0 z-10 rounded-lg"
      />
      {card}
    </div>
  )
}
