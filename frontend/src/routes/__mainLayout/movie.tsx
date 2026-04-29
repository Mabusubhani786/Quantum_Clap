import { createFileRoute } from "@tanstack/react-router"

import { CardInfo } from "@/components/CardInfo"

export const Route = createFileRoute("/__mainLayout/movie")({
  component: RouteComponent,
})

const movies = [
  {
    title: "Dune: Part Two",
    posterImage:
      "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropImage:
      "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    mediaType: "movie",
    description:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    rating: "8.1",
    releaseDate: "01 Mar 2024",
  },
  {
    title: "Kingdom of the Planet of the Apes",
    posterImage:
      "https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg",
    backdropImage:
      "https://image.tmdb.org/t/p/original/fypydCipcWDKDTTCoPucBsdGYXW.jpg",
    mediaType: "movie",
    description:
      "A young ape questions everything he has been taught about the past and makes choices that will define the future.",
    genres: ["Adventure", "Sci-Fi", "Action"],
    rating: "7.1",
    releaseDate: "10 May 2024",
  },
  {
    title: "Inside Out 2",
    posterImage:
      "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    backdropImage:
      "https://image.tmdb.org/t/p/original/stKGOm8UyhuLPR9sZLjs5AkmncA.jpg",
    mediaType: "movie",
    description:
      "Riley's mind headquarters faces a sudden renovation when new emotions arrive and shift the balance.",
    genres: ["Animation", "Family", "Comedy"],
    rating: "7.6",
    releaseDate: "14 Jun 2024",
  },
]

function RouteComponent() {
  return (
    <section className="w-full py-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Movies</h1>
          <p className="text-sm text-muted-foreground">
            Browse featured movies with poster images and quick details.
          </p>
        </div>
      </div>

      <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,520px),1fr))] gap-4">
        {movies.map((movie) => (
          <CardInfo
            key={movie.title}
            posterImage={movie.posterImage}
            backdropImage={movie.backdropImage}
            imageAlt={`${movie.title} poster`}
            title={movie.title}
            mediaType={movie.mediaType}
            description={movie.description}
            genres={movie.genres}
            rating={movie.rating}
            releaseDate={movie.releaseDate}
          />
        ))}
      </div>
    </section>
  )
}
