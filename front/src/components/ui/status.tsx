import { isValidElement, type ReactNode } from 'react'
import { StatusDot as astryxStatusDot } from '@astryxdesign/core'
import { cn } from '@/lib/cn'

const astryxComponents = { statusDot: astryxStatusDot }

export type StatusTone = 'neutral' | 'ok' | 'warn' | 'danger'

const statusDotVariants: Record<StatusTone, 'neutral' | 'success' | 'warning' | 'error'> = {
  neutral: 'neutral',
  ok: 'success',
  warn: 'warning',
  danger: 'error',
}

const extractText = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children)
  return ''
}

interface StatusProps {
  tone?: StatusTone
  children: ReactNode
  className?: string
}

export const status = ({ tone = 'neutral', children, className }: StatusProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[7px] whitespace-nowrap text-[12.5px] text-muted',
        className,
      )}
    >
      <astryxComponents.statusDot
        variant={statusDotVariants[tone]}
        label={extractText(children) || 'Estado'}
        aria-hidden="true"
        className="size-1.5"
      />
      {children}
    </span>
  )
}
