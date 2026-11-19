import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'
import * as iconComponents from '@/components/ui/icon'
import * as meanderComponents from '@/components/ui/meander'

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
        'mb-8 flex flex-col items-start justify-between gap-5 min-[821px]:flex-row min-[821px]:items-end',
        className,
      )}
    >
      <div>
        <h1 className="flex items-center gap-3 font-serif text-[clamp(28px,3vw,34px)] font-normal leading-[1.1] tracking-[-0.02em]">
          {icon && <iconComponents.icon icon={icon} size="lg" className="text-gold" />}
          {title}
        </h1>
        <meanderComponents.meander className="mt-3 w-16" />
        {lede && <p className="mt-3 max-w-[62ch] text-sm text-muted">{lede}</p>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2.5">{actions}</div>}
    </header>
  )
}
