import type { HTMLAttributes, ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'
import * as iconComponents from './icon'

export const metricStrip = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 divide-y divide-line border-y border-line md:grid-cols-3 md:divide-x md:divide-y-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface MetricProps {
  icon?: IconType
  label: ReactNode
  value: ReactNode
  delta?: ReactNode
}

export const metric = ({ icon, label, value, delta }: MetricProps) => {
  return (
    <div className="group py-6 md:px-8 md:first:pl-0">
      <div className="inline-flex items-center gap-[7px] text-xs uppercase tracking-[0.05em] text-faint">
        {icon && (
          <iconComponents.icon
            icon={icon}
            size="sm"
            className="transition-colors duration-200 group-hover:text-gold"
          />
        )}
        {label}
      </div>
      <div className="mt-2 font-serif text-[38px] leading-[1.05] tracking-[-0.01em] tabular-nums">
        {value}
      </div>
      {delta && <div className="mt-1.5 text-[12.5px] text-muted">{delta}</div>}
    </div>
  )
}
