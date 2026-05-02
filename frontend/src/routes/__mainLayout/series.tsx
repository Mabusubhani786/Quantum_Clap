import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import {
  type EndpointConfig,
  MediaCatalogPage,
} from "@/components/MediaCatalogPage"

export const Route = createFileRoute("/__mainLayout/series")({
  component: RouteComponent,
})

type ApiEndpoints = {
  tv: {
    popular: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints

function RouteComponent() {
  return (
    <MediaCatalogPage
      title="Series"
      description="Browse popular series with episode-ready artwork, ratings, genres, and release years."
      endpoint={endpoints.tv.popular}
      mediaType="tv"
      mediaLabel="Series"
    />
  )
}
