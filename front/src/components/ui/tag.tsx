import type { ReactNode } from 'react'
import { Badge as astryxBadge } from '@astryxdesign/core'
import { cn } from '@/lib/cn'

const astryxComponents = { badge: astryxBadge }

interface TagProps {
  children: ReactNode
  className?: string
}

export const tag = ({ children, className }: TagProps) => {
  return (
    <astryxComponents.badge
      label={children}
      variant="neutral"
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md border border-line-strong bg-transparent px-2 py-0.5 text-xs tracking-[0.04em] text-muted',
        className,
      )}
    />
  )
}
