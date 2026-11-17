import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type AvatarSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'size-8 text-[11px]',
  md: 'size-[34px] text-xs',
  lg: 'size-[60px] font-serif text-[19px] font-normal',
}

interface AvatarProps {
  children: ReactNode
  size?: AvatarSize
  className?: string
}

export const avatar = ({ children, size = 'md', className }: AvatarProps) => {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full border border-line-strong bg-transparent font-semibold text-muted transition-colors duration-200 group-hover:border-gold group-hover:text-gold-strong',
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
