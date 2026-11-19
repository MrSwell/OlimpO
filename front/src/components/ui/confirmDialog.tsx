import type { ReactNode } from 'react'
import { LuTriangleAlert as luTriangleAlert } from 'react-icons/lu'
import * as buttonComponents from './button'
import * as modalComponents from './modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  isSubmitting?: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Confirmation step for destructive actions. Keeps the native dialog behavior
 * (focus trap, Escape, focus return) and marks the confirm action as dangerous.
 */
export const confirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  isSubmitting = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => (
  <modalComponents.modal
    open={open}
    onClose={onClose}
    title={title}
    icon={luTriangleAlert}
    footer={
      <>
        <buttonComponents.button variant="quiet" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </buttonComponents.button>
        <buttonComponents.button variant="danger" onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? 'Eliminando…' : confirmLabel}
        </buttonComponents.button>
      </>
    }
  >
    <p className="text-[13px] leading-relaxed text-muted">{description}</p>
  </modalComponents.modal>
)
