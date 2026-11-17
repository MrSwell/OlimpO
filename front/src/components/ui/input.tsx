import type { InputHTMLAttributes, Ref } from 'react'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'
import * as iconComponents from './icon'

export const inputClassName =
  'w-full rounded-control border border-line-strong bg-panel-2 px-3 py-2.5 font-sans text-[13.5px] leading-[1.4] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconType
  ref?: Ref<HTMLInputElement>
}

export const input = ({ icon, className, ref, ...props }: InputProps) => {
  const isInvalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true'
  const field = (
    <input
      ref={ref}
      className={cn(
        inputClassName,
        'aria-invalid:border-danger focus:aria-invalid:border-danger',
        icon && 'pl-9',
        className,
      )}
      {...props}
    />
  )

  if (!icon) return field

  return (
    <div className="relative">
      <iconComponents.icon
        icon={icon}
        size="md"
        className={cn(
          'pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2',
          isInvalid ? 'text-danger' : 'text-faint',
        )}
      />
      {field}
    </div>
  )
}
