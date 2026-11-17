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
            d="M1 9 V1 H15 V7 H8 V4 H11"
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
