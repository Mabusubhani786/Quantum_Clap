import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import {
  type EndpointConfig,
  MediaCatalogPage,
} from "@/components/MediaCatalogPage"

export const Route = createFileRoute("/__mainLayout/movie/")({
  component: RouteComponent,
})

type ApiEndpoints = {
  discover: {
    movies: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints
const defaultMovieParams = { sort_by: "popularity.desc" }

function RouteComponent() {
  return (
    <MediaCatalogPage
      title="Movies"
      description="Browse popular movies with rich artwork, genres, ratings, and quick details."
      endpoint={endpoints.discover.movies}
      mediaType="movie"
      mediaLabel="Movie"
      detailBasePath="/movie"
      params={defaultMovieParams}
    />
  )
}
