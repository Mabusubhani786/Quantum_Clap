import { createFileRoute } from "@tanstack/react-router"

import apiEndPoints from "@/api-fetch-endpoints/apiEndPoints.json"
import { CompanyDetailPage } from "@/components/EntityDetailPage"
import type { EndpointConfig } from "@/components/MediaCatalogPage"

export const Route = createFileRoute("/__mainLayout/company/$companyId")({
  component: RouteComponent,
})

type ApiEndpoints = {
  companies: {
    details: EndpointConfig
    images: EndpointConfig
    alternative_names: EndpointConfig
  }
}

const endpoints = apiEndPoints as ApiEndpoints

function RouteComponent() {
  const { companyId } = Route.useParams()

  return (
    <CompanyDetailPage
      id={companyId}
      detailEndpoint={endpoints.companies.details}
      imagesEndpoint={endpoints.companies.images}
      alternativeNamesEndpoint={endpoints.companies.alternative_names}
    />
  )
}
