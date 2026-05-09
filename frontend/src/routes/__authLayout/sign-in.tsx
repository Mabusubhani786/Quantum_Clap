import { createFileRoute } from "@tanstack/react-router"

import { SignInForm } from "@/components/SignInForm"

export const Route = createFileRoute("/__authLayout/sign-in")({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignInForm />
}
