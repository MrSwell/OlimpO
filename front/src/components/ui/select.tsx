import type { Ref, SelectHTMLAttributes } from 'react'
import { LuChevronDown as luChevronDown } from 'react-icons/lu'
import { cn } from '@/lib/cn'
import * as iconComponents from './icon'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>
}

export const select = ({ className, ref, children, ...props }: SelectProps) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-control border border-line-strong bg-panel-2 px-3 py-2.5 pr-9 font-sans text-[13.5px] leading-[1.4] text-ink outline-none transition-colors focus:border-gold',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <iconComponents.icon
        icon={luChevronDown}
        size="md"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  )
}
