// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { memo, useId } from 'react'
import { cn } from '@/lib/cn'

interface MeanderProps {
  className?: string
}

/**
 * The only ornament in the system: a 1px Greek meander in gold at 55%.
 */
export const meander = memo(({ className }: MeanderProps) => {
  const patternId = `meander-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <svg
      aria-hidden="true"
      className={cn('h-2.5 text-gold opacity-55', className ?? 'w-24')}
      width="100%"
      height="10"
    >
      <defs>
        <pattern
          id={patternId}
          width="22"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 9 H4 V2 H18 V6 H10 V9 H22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </pattern>
      </defs>
      <rect width="100%" height="10" fill={`url(#${patternId})`} />
    </svg>
  )
})
