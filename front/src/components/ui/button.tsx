import { createElement, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Button as astryxButton } from '@astryxdesign/core'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/cn'

const astryxComponents = { button: astryxButton }

export type ButtonVariant = 'default' | 'primary' | 'quiet' | 'danger'
export type ButtonSize = 'md' | 'sm'

const baseClassName =
  'inline-flex items-center justify-center gap-2 rounded-control border font-sans font-medium transition-colors duration-150'

const variantClassNames: Record<ButtonVariant, string> = {
  // Secondary action: gentle gold — soft fill, mixed border, still clearly a button.
  default: 'border-gold-border bg-gold-soft text-gold-strong hover:border-gold hover:bg-gold-soft-strong',
  // Primary action: the one full-gold region of the view.
  primary: 'border-gold bg-gold text-gold-ink hover:border-gold-strong hover:bg-gold-strong',
  quiet: 'border-transparent bg-transparent text-muted hover:text-ink',
  // Destructive action: never a full red block; tinted border and text.
  danger: 'border-danger/50 bg-danger/10 text-danger hover:border-danger hover:bg-danger/15',
}

const astryxVariants: Record<ButtonVariant, 'primary' | 'secondary' | 'ghost'> = {
  default: 'secondary',
  primary: 'primary',
  quiet: 'ghost',
  danger: 'secondary',
}

const sizeClassNames: Record<ButtonSize, string> = {
  md: 'min-h-9 px-[15px] text-[13px] leading-[1.3]',
  sm: 'min-h-7 px-[11px] text-[12.5px] leading-[1.3]',
}

export const buttonClassName = (
  variant: ButtonVariant = 'default',
  size: ButtonSize = 'md',
  className?: string,
): string => {
  return cn(baseClassName, variantClassNames[variant], sizeClassNames[size], className)
}

/**
 * Astryx uses `label` as the accessible name. Our call sites pass visible
 * children, so we derive the name from them when no explicit label is given.
 */
const extractText = (node: ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children)
  return ''
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconType
  iconPosition?: 'left' | 'right'
  label?: string
  disabled?: boolean
}

export const button = ({
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  className,
  type = 'button',
  disabled = false,
  label,
  ...props
}: ButtonProps) => {
  const accessibleLabel = label ?? (extractText(children) || props['aria-label'] || 'Acción')
  const iconNode = icon
    ? createElement(icon, {
        size: size === 'sm' ? 14 : 15,
        strokeWidth: 1.7,
        'aria-hidden': true,
      })
    : undefined

  return (
    <astryxComponents.button
      {...props}
      label={accessibleLabel}
      variant={astryxVariants[variant]}
      size={size}
      type={type}
      isDisabled={disabled}
      icon={iconPosition === 'left' ? iconNode : undefined}
      endContent={iconPosition === 'right' ? iconNode : undefined}
      className={buttonClassName(variant, size, className)}
    >
      {children}
    </astryxComponents.button>
  )
}
