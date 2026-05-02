import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type MediaPaginationProps = {
  page: number
  totalPages: number
  loading?: boolean
  onPrevious: () => void
  onNext: () => void
}

export function MediaPagination({
  page,
  totalPages,
  loading,
  onPrevious,
  onNext,
}: MediaPaginationProps) {
  const canGoPrevious = page > 1 && !loading
  const canGoNext = page < totalPages && !loading

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-3 sm:w-auto sm:px-4">
      <div className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span>
        <span className="mx-1">of</span>
        <span className="font-medium text-foreground">{totalPages}</span>
      </div>

      <Pagination className="mx-0 w-full justify-end sm:w-auto">
        <PaginationContent className="w-full justify-between sm:w-auto sm:justify-end">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={!canGoPrevious}
              className={!canGoPrevious ? "pointer-events-none opacity-50" : ""}
              onClick={(event) => {
                event.preventDefault()
                if (canGoPrevious) {
                  onPrevious()
                }
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={!canGoNext}
              className={!canGoNext ? "pointer-events-none opacity-50" : ""}
              onClick={(event) => {
                event.preventDefault()
                if (canGoNext) {
                  onNext()
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
