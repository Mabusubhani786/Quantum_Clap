import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

type HeroVideoDialogProps = {
  open: boolean
  title: string
  description?: string
  videoUrl?: string
  onOpenChange: (open: boolean) => void
}

export function HeroVideoDialog({
  open,
  title,
  description,
  videoUrl,
  onOpenChange,
}: HeroVideoDialogProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onOpenChange, open])

  if (!open || !videoUrl) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 text-white backdrop-blur-2xl sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} video preview`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div className="relative w-full max-w-[88rem]">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="absolute -top-12 right-0 z-10 rounded-md border-white/12 bg-white/10 text-white shadow-xl shadow-black/30 hover:bg-white/18 hover:text-white sm:-top-14"
          onClick={() => onOpenChange(false)}
          aria-label="Close preview"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="overflow-hidden rounded-lg border border-white/12 bg-black shadow-2xl shadow-black/60 ring-1 ring-white/8">
          <div className="aspect-video w-full bg-black">
            <iframe
              title={`${title} video preview`}
              src={videoUrl}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-white/[0.04] px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-medium uppercase tracking-wide text-white/44">
                Play Preview
              </p>
              <h2 className="line-clamp-1 text-sm font-semibold sm:text-base">
                {title}
              </h2>
            </div>
            {description && (
              <p className="line-clamp-1 max-w-full text-xs text-white/54 sm:max-w-md">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
