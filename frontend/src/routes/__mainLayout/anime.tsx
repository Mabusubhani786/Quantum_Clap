import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__mainLayout/anime')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/__mainLayout/anime"!</div>
}
