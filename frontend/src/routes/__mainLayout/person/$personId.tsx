import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import { PersonDetailPage } from "@/components/EntityDetailPage"
import type { EndpointConfig } from "@/components/MediaCatalogPage"

export const Route = createFileRoute("/__mainLayout/person/$personId")({
  component: RouteComponent,
})

type ApiEndpoints = {
  person: {
    details: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints

function RouteComponent() {
  const { personId } = Route.useParams()

  return (
    <PersonDetailPage
      id={personId}
      detailEndpoint={endpoints.person.details}
    />
  )
}
