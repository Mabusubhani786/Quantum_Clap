import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import {
  type EndpointConfig,
  MediaCatalogPage,
} from "@/components/MediaCatalogPage"

export const Route = createFileRoute("/__mainLayout/anime/")({
  component: RouteComponent,
})

type ApiEndpoints = {
  discover: {
    tv: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints
const animeParams = {
  sort_by: "popularity.desc",
  with_genres: 16,
  with_origin_country: "JP",
}

function RouteComponent() {
  return (
    <MediaCatalogPage
      title="Anime"
      description="Explore popular anime series from TMDB using animation and Japanese-origin discovery filters."
      endpoint={endpoints.discover.tv}
      mediaType="tv"
      mediaLabel="Anime"
      detailBasePath="/anime"
      params={animeParams}
    />
  )
}
