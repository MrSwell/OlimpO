// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { createElement, memo, useEffect } from 'react'
import type { IconType } from 'react-icons'
import {
  LuCircleAlert as luCircleAlert,
  LuCircleCheck as luCircleCheck,
  LuInfo as luInfo,
  LuX as luX,
} from 'react-icons/lu'
import { cn } from '@/lib/cn'
import type { ToastItem, ToastTone } from '@/stores/toastStore'
import * as iconComponents from './icon'

const toastIcons: Record<ToastTone, IconType> = {
  error: luCircleAlert,
  success: luCircleCheck,
  info: luInfo,
}

const toastToneClassNames: Record<ToastTone, string> = {
  error: 'text-danger',
  success: 'text-success',
  info: 'text-gold',
}

interface ToastProps {
  toast: ToastItem
  onDismiss: () => void
}

export const toast = memo(({ toast, onDismiss }: ToastProps) => {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, toast.duration)
    return () => window.clearTimeout(timer)
  }, [onDismiss, toast.duration])

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="toastEnter flex w-full items-start gap-3 rounded-[10px] border border-line-strong bg-panel px-4 py-3.5 shadow-[var(--shadow-pop)]"
    >
      <iconComponents.icon
        icon={toastIcons[toast.tone]}
        size="md"
        className={cn('mt-px', toastToneClassNames[toast.tone])}
      />
      <div className="min-w-0 flex-1">
        <b className="block text-[13px] font-medium">{toast.title}</b>
        {toast.description && (
          <span className="mt-0.5 block text-[12.5px] text-muted">{toast.description}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="shrink-0 p-0.5 text-base leading-none text-faint transition-colors hover:text-ink"
      >
        {createElement(luX, { 'aria-hidden': true, size: 16, strokeWidth: 1.7 })}
      </button>
    </div>
  )
})
