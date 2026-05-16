import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import {
  type EndpointConfig,
  MediaCatalogPage,
} from "@/components/MediaCatalogPage"

export const Route = createFileRoute("/__mainLayout/series/")({
  component: RouteComponent,
})

type ApiEndpoints = {
  discover: {
    tv: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints
const defaultSeriesParams = { sort_by: "popularity.desc" }

function RouteComponent() {
  return (
    <MediaCatalogPage
      title="Series"
      description="Browse popular series with episode-ready artwork, ratings, genres, and release years."
      endpoint={endpoints.discover.tv}
      mediaType="tv"
      mediaLabel="Series"
      detailBasePath="/series"
      params={defaultSeriesParams}
    />
  )
}
