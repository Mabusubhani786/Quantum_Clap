import { createRootRoute, Outlet } from "@tanstack/react-router"
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="system" storageKey="quantum-clap-theme">
      <TooltipProvider>
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
      </TooltipProvider>
    </ThemeProvider>
  ),
})
