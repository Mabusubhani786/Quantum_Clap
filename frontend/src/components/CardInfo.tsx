import { CalendarDays, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"
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
  className,
}: CardInfoProps) {
  return (
    <Card
      className={cn(
        "relative isolate overflow-hidden rounded-lg border-white/10 bg-[#050505] bg-cover bg-center py-0 text-white shadow-xl shadow-black/20 ring-white/10",
        className
      )}
      style={{ backgroundImage: `url(${backdropImage})` }}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/75 to-black/35" />
      <div className="absolute inset-0 -z-10 bg-black/20" />

      <CardContent className="grid gap-4 p-4 sm:grid-cols-[140px_1fr] lg:grid-cols-[160px_1fr]">
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
            <h3 className="line-clamp-2 text-2xl leading-tight font-bold">
              {title}
            </h3>
            <Badge className="border-white/10 bg-white/12 px-3 py-1 text-sm text-white hover:bg-white/16">
              {mediaType}
            </Badge>
          </div>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="min-w-20 border border-lime-700 bg-white/80 px-3 py-1 text-center text-sm font-medium text-black hover:bg-white/90"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          <p className="line-clamp-3 max-w-3xl text-base leading-7 text-white/95">
            {description}
          </p>

          {(rating || releaseDate) && (
            <div className="flex flex-wrap items-center gap-3 text-base text-white">
              {rating && (
                <span className="inline-flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                  {rating}
                </span>
              )}
              {rating && releaseDate && (
                <span className="text-white/55">|</span>
              )}
              {releaseDate && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-white/75" />
                  {releaseDate}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
