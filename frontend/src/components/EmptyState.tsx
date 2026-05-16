import { Clapperboard, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  compact?: boolean
}

export function EmptyState({
  title = "No data is available",
  description = "We could not find anything to show here right now. Try refreshing or adjusting your filters.",
  actionLabel,
  onAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "relative isolate overflow-hidden rounded-lg border-dashed bg-card/70 py-0 text-center shadow-sm",
        className
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(16,185,129,0.08),transparent_42%,rgba(14,165,233,0.08))]" />
      <CardContent
        className={cn(
          "mx-auto flex max-w-xl flex-col items-center px-5",
          compact ? "py-5" : "py-10"
        )}
      >
        <div className="relative mb-4 grid size-24 place-items-center">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
          <div className="absolute inset-3 animate-spin rounded-full border border-transparent border-t-primary/45 border-r-primary/20 [animation-duration:2.8s]" />
          <div className="relative grid size-16 place-items-center rounded-2xl border border-border bg-background/85 shadow-xl">
            <Clapperboard className="size-7 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {onAction && actionLabel ? (
          <Button className="mt-5 rounded-md" size="sm" onClick={onAction}>
            <RefreshCw className="size-3.5" />
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
