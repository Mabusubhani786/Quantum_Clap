import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import type { EndpointConfig } from "@/components/MediaCatalogPage"
import { SeasonDetailPage } from "@/components/SeriesOverviewPage"

export const Route = createFileRoute(
  "/__mainLayout/series/$mediaId/season/$seasonNumber/"
)({
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
  const { mediaId, seasonNumber } = Route.useParams()

  return (
    <SeasonDetailPage
      id={mediaId}
      seasonNumber={seasonNumber}
      detailEndpoint={endpoints.tv.details}
      seasonEndpoint={endpoints.tv_seasons.details}
      mediaLabel="Series"
      detailBasePath="/series"
    />
  )
}
