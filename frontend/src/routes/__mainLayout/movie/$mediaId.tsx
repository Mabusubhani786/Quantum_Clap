import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import { MediaDetailPage } from "@/components/MediaDetailPage"
import type { EndpointConfig } from "@/components/MediaCatalogPage"

export const Route = createFileRoute("/__mainLayout/movie/$mediaId")({
  component: RouteComponent,
})

type ApiEndpoints = {
  movies: {
    details: EndpointConfig
    recommendations: EndpointConfig
    similar: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints

function RouteComponent() {
  const { mediaId } = Route.useParams()

  return (
    <MediaDetailPage
      id={mediaId}
      endpoint={endpoints.movies.details}
      similarEndpoint={endpoints.movies.similar}
      recommendationsEndpoint={endpoints.movies.recommendations}
      mediaLabel="Movie"
      detailBasePath="/movie"
    />
  )
}
