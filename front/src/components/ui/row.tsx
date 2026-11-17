import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface RowsProps {
  children: ReactNode
  className?: string
}

export const rows = ({ children, className }: RowsProps) => {
  return <div className={cn('grid', className)}>{children}</div>
}

interface RowProps {
  time?: ReactNode
  title: ReactNode
  meta?: ReactNode
  end?: ReactNode
  className?: string
}

export const row = ({ time, title, meta, end, className }: RowProps) => {
  return (
    <div
      className={cn(
        'group flex items-baseline gap-3.5 border-b border-line py-3.5 last:border-b-0',
        className,
      )}
    >
      {time && (
        <span className="w-16 shrink-0 text-xs text-faint tabular-nums">{time}</span>
      )}
      <div className="min-w-0 flex-1">
        <b className="block text-[13.5px] font-medium">{title}</b>
        {meta && <small className="text-xs text-faint">{meta}</small>}
      </div>
      {end && (
        <span className="shrink-0 text-[12.5px] text-muted tabular-nums transition-colors duration-150 group-hover:text-ink">
          {end}
        </span>
      )}
    </div>
  )
}
