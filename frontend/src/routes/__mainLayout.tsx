import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"

import { HeroSection } from "@/components/HeroSection"
import { HeaderLayout } from "@/layout/headerLayout"

export const Route = createFileRoute("/__mainLayout")({
  component: RouteComponent,
})

function RouteComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const showHeroSection = !pathname.startsWith("/profile")

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HeaderLayout />
      {showHeroSection ? <HeroSection /> : null}
      <main
        className={
          showHeroSection
            ? "w-full min-w-0 px-2 pt-6 sm:px-3"
            : "w-full min-w-0"
        }
      >
        <Outlet />
      </main>
    </div>
  )
}
