import { createElement } from 'react'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'

const iconSizes = {
  sm: 13,
  md: 16,
  lg: 22,
} as const

export type IconSize = keyof typeof iconSizes

interface IconProps {
  icon: IconType
  size?: IconSize
  label?: string
  className?: string
}

export const icon = ({ icon: iconGlyph, size = 'md', label, className }: IconProps) => {
  return createElement(iconGlyph, {
    size: iconSizes[size],
    strokeWidth: 1.7,
    'aria-hidden': label ? undefined : true,
    'aria-label': label,
    role: label ? 'img' : undefined,
    className: cn('shrink-0', className),
  })
}
