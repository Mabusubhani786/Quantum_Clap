import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import { MediaDetailPage } from "@/components/MediaDetailPage"
import type { EndpointConfig } from "@/components/MediaCatalogPage"

export const Route = createFileRoute("/__mainLayout/anime/$mediaId")({
  component: RouteComponent,
})

type ApiEndpoints = {
  tv: {
    details: EndpointConfig
    recommendations: EndpointConfig
    similar: EndpointConfig
  }
  tv_seasons: {
    details: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints

function RouteComponent() {
  const { mediaId } = Route.useParams()
  const location = useLocation()

  if (location.pathname !== `/anime/${mediaId}`) {
    return <Outlet />
  }

  return (
    <MediaDetailPage
      id={mediaId}
      endpoint={endpoints.tv.details}
      similarEndpoint={endpoints.tv.similar}
      recommendationsEndpoint={endpoints.tv.recommendations}
      seasonEndpoint={endpoints.tv_seasons.details}
      mediaLabel="Anime"
      detailBasePath="/anime"
    />
  )
}
