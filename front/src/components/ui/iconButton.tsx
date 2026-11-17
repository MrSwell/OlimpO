import { createElement, type ButtonHTMLAttributes } from 'react'
import { IconButton as astryxIconButton } from '@astryxdesign/core'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'

const astryxComponents = { iconButton: astryxIconButton }

export type IconButtonVariant = 'ghost' | 'outline'

const variantClassNames: Record<IconButtonVariant, string> = {
  ghost: 'border-transparent text-muted hover:border-line-strong hover:text-ink',
  outline: 'border-line-strong text-muted hover:border-gold hover:text-gold-strong',
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  icon: IconType
  label: string
  iconClassName?: string
  variant?: IconButtonVariant
  disabled?: boolean
}

export const iconButton = ({
  icon,
  label,
  iconClassName,
  variant = 'ghost',
  className,
  type = 'button',
  disabled = false,
  ...props
}: IconButtonProps) => {
  return (
    <astryxComponents.iconButton
      {...props}
      label={label}
      icon={createElement(icon, {
        size: 15,
        strokeWidth: 1.7,
        'aria-hidden': true,
        className: cn('shrink-0', iconClassName),
      })}
      variant={variant === 'outline' ? 'secondary' : 'ghost'}
      type={type}
      isDisabled={disabled}
      className={cn(
        'inline-grid size-[34px] shrink-0 place-items-center rounded-control border bg-transparent transition-colors',
        variantClassNames[variant],
        className,
      )}
    />
  )
}
