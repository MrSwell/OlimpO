import { cn } from '@/lib/cn'

interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

const pageWindow = (page: number, totalPages: number): number[] => {
  const size = Math.min(5, totalPages)
  let start = Math.max(1, page - Math.floor(size / 2))
  let end = start + size - 1

  if (end > totalPages) {
    end = totalPages
    start = Math.max(1, end - size + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export const pagination = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) => {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div
      className={cn(
        'mt-7 flex flex-wrap items-center justify-between gap-4 text-[12.5px] text-faint',
        className,
      )}
    >
      <span>
        {from}–{to} de {totalItems}
      </span>
      <nav className="flex items-center gap-4" aria-label="Paginación">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="text-muted transition-colors hover:text-gold-strong disabled:cursor-not-allowed disabled:opacity-45"
        >
          Anterior
        </button>
        {pageWindow(page, totalPages).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'transition-colors hover:text-gold-strong',
              item === page ? 'text-ink' : 'text-muted',
            )}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="text-muted transition-colors hover:text-gold-strong disabled:cursor-not-allowed disabled:opacity-45"
        >
          Siguiente
        </button>
      </nav>
    </div>
  )
}
