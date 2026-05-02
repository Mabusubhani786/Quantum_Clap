import { createFileRoute, Outlet } from "@tanstack/react-router"

import { HeroSection } from "@/components/HeroSection"
import { HeaderLayout } from "@/layout/headerLayout"

export const Route = createFileRoute("/__mainLayout")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HeaderLayout />
      <HeroSection />
      <main className="w-full min-w-0 px-2 pt-6 sm:px-3">
        <Outlet />
      </main>
    </div>
  )
}
