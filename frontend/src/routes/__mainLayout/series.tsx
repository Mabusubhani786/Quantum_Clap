import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__mainLayout/series')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/__mainLayout/series"!</div>
}
