import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/__mainLayout/")({
  beforeLoad: () => {
    throw redirect({ to: "/home" })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return null
}
