import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__mainLayout/home')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/__mainLayout/home"!</div>
}
