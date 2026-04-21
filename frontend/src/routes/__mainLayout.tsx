import { createFileRoute, Outlet } from "@tanstack/react-router"

import { HeaderLayout } from "@/layout/headerLayout"

export const Route = createFileRoute("/__mainLayout")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeaderLayout />
      <main className="px-2 sm:px-3">
        <Outlet />
      </main>
    </div>
  )
}
