import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/__authLayout/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
