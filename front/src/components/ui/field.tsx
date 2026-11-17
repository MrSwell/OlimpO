import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import * as fieldErrorComponents from './fieldError'

interface FieldProps {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}

export const field = ({ label, htmlFor, hint, error, children, className }: FieldProps) => {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined

  return (
    <div className={cn('grid gap-[7px]', className)}>
      <label htmlFor={htmlFor} className="text-[12.5px] text-muted">
        {label}
      </label>
      {children}
      {error && <fieldErrorComponents.fieldError id={errorId} message={error} />}
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  )
}
