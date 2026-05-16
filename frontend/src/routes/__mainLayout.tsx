import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router"
import { toast } from "sonner"

import { HeroSection } from "@/components/HeroSection"
import { HeaderLayout } from "@/layout/headerLayout"
import {
  clearAuthSession,
  ensureValidAccessToken,
  hasAccessToken,
} from "@/lib/auth-session"

export const Route = createFileRoute("/__mainLayout")({
  beforeLoad: async ({ location }) => {
    if (await ensureValidAccessToken()) {
      if (location.pathname === "/") {
        throw redirect({ to: "/home" })
      }

      return
    }

    if (hasAccessToken()) {
      toast.error("Session expired. Please sign in again.")
    } else {
      toast.error("Please sign in to continue.")
    }
    clearAuthSession()
    throw redirect({
      to: "/sign-in",
    })
  },
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
