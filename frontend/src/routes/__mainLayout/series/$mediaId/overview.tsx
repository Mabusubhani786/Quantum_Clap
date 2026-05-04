import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import type { EndpointConfig } from "@/components/MediaCatalogPage"
import { SeriesOverviewPage } from "@/components/SeriesOverviewPage"

export const Route = createFileRoute("/__mainLayout/series/$mediaId/overview")({
  component: RouteComponent,
})

type ApiEndpoints = {
  tv: {
    details: EndpointConfig
  }
  tv_seasons: {
    details: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints

function RouteComponent() {
  const { mediaId } = Route.useParams()

  return (
    <SeriesOverviewPage
      id={mediaId}
      detailEndpoint={endpoints.tv.details}
      seasonEndpoint={endpoints.tv_seasons.details}
      mediaLabel="Series"
      detailBasePath="/series"
    />
  )
}
