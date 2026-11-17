import type { ReactNode } from 'react'
import { EmptyState as astryxEmptyState } from '@astryxdesign/core'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'
import * as iconComponents from './icon'

const astryxComponents = { emptyState: astryxEmptyState }

interface EmptyStateProps {
  icon?: IconType
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export const emptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <astryxComponents.emptyState
      title={title}
      description={description}
      icon={icon ? <iconComponents.icon icon={icon} size="lg" /> : undefined}
      actions={action}
      headingLevel={2}
      className={cn(
        'px-5 py-14 text-muted [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:text-ink [&_p]:mx-auto [&_p]:max-w-[46ch] [&_p]:text-[13px] [&_p]:leading-relaxed',
        className,
      )}
    />
  )
}
