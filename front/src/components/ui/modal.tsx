// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { useId, type ReactNode } from 'react'
import { Dialog as astryxDialog } from '@astryxdesign/core'
import type { IconType } from 'react-icons'
import { LuX as luX } from 'react-icons/lu'
import { cn } from '@/lib/cn'
import * as iconComponents from './icon'
import * as iconButtonComponents from './iconButton'

const astryxComponents = { dialog: astryxDialog }

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  icon?: IconType
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Astryx Dialog owns the native `<dialog>` behavior: focus trap, initial focus,
 * Escape, backdrop dismissal and focus return. The v4 surface stays ours.
 */
export const modal = ({ open, onClose, title, icon, children, footer, className }: ModalProps) => {
  const titleId = useId()

  return (
    <astryxComponents.dialog
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      purpose="info"
      width={560}
      maxHeight="calc(100vh - 40px)"
      padding={0}
      aria-labelledby={titleId}
      className={cn(
        'olimpoModal m-auto overflow-y-auto rounded-panel border border-line-strong bg-panel text-ink shadow-[var(--shadow-pop)]',
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
        <h2 id={titleId} className="inline-flex items-center gap-[9px] text-[17px] font-semibold">
          {icon && <iconComponents.icon icon={icon} size="md" className="text-gold" />}
          {title}
        </h2>
        <iconButtonComponents.iconButton icon={luX} label="Cerrar" onClick={onClose} />
      </div>

      <div className="grid gap-4 px-6 py-5">{children}</div>

      {footer && (
        <div className="flex justify-end gap-2.5 border-t border-line px-6 py-4">{footer}</div>
      )}
    </astryxComponents.dialog>
  )
}
