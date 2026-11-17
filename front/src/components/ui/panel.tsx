import type { HTMLAttributes, ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'
import * as iconComponents from './icon'

export const panel = ({ className, children, ...props }: HTMLAttributes<HTMLElement>) => {
  return (
    <section
      className={cn(
        'group rounded-panel border border-line bg-panel p-6 transition-colors duration-200 hover:border-line-strong',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

interface PanelHeadProps {
  icon?: IconType
  title: ReactNode
  action?: ReactNode
  className?: string
}

export const panelHead = ({ icon, title, action, className }: PanelHeadProps) => {
  return (
    <div
      className={cn(
        'mb-1.5 flex items-center justify-between gap-4 border-b border-line pb-3.5',
        className,
      )}
    >
      <h2 className="inline-flex items-center gap-[9px] text-[15px] font-semibold">
        {icon && (
          <iconComponents.icon
            icon={icon}
            size="sm"
            className="text-faint transition-colors duration-200 group-hover:text-gold"
          />
        )}
        {title}
      </h2>
      {action}
    </div>
  )
}
