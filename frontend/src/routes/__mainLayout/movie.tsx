import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__mainLayout/movie')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/__mainLayout/movie"!</div>
}
