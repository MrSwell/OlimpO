import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'
import * as iconComponents from '@/components/ui/icon'

interface PageHeadProps {
  title: ReactNode
  icon?: IconType
  lede?: ReactNode
  actions?: ReactNode
  className?: string
}

export const pageHead = ({ title, icon, lede, actions, className }: PageHeadProps) => {
  return (
    <header
      className={cn(
        'mb-10 flex flex-col items-start justify-between gap-5 min-[821px]:flex-row min-[821px]:items-end',
        className,
      )}
    >
      <div>
        <h1 className="flex items-center gap-3 text-[30px] leading-[1.15]">
          {icon && <iconComponents.icon icon={icon} size="lg" className="text-gold" />}
          {title}
        </h1>
        {lede && <p className="mt-2.5 max-w-[62ch] text-sm text-muted">{lede}</p>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2.5">{actions}</div>}
    </header>
  )
}
