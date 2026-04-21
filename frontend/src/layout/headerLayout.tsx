import { Link } from "@tanstack/react-router"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

type NavItem = {
  label: string
  to: "/home" | "/movie" | "/series" | "/anime"
}

const navItems: NavItem[] = [
  { label: "Home", to: "/home" },
  { label: "Movies", to: "/movie" },
  { label: "Series", to: "/series" },
  { label: "Anime", to: "/anime" },
]

export function HeaderLayout() {
  return (
    <header className="border-b border-secondary/60 bg-[var(--header-background)] text-primary-foreground">
      <div className="mx-auto flex h-20 w-full items-center justify-between px-2 sm:px-3">
        <Link to="/home" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            V
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">Vexto</span>
            <span className="text-[var(--text-tertiary)]">||</span>
            <span className="text-[var(--text-secondary)]">Media</span>
          </div>
        </Link>

        <NavigationMenu viewport={false}>
          <NavigationMenuList className="gap-2">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.to}>
                <NavigationMenuLink
                  asChild
                  className="rounded-md text-primary-foreground hover:bg-[#EEEFF2] hover:text-[#1C1C1C] focus:bg-[#EEEFF2] focus:text-[#1C1C1C]"
                >
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === "/home" }}
                    activeProps={{
                      className: "rounded-md bg-[#EEEFF2] font-medium text-[#1C1C1C]",
                    }}
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}
