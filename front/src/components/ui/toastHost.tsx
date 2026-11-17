// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { memo, useEffect } from 'react'
import { useToastStore } from '@/stores/toastStore'
import * as toastComponents from './toast'

export const toastHost = memo(() => {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)
  const clear = useToastStore((state) => state.clear)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (document.querySelector('dialog[open]')) return
      clear()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clear])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed right-4 bottom-4 z-[60] flex w-[min(370px,calc(100vw-32px))] flex-col gap-3 sm:right-6 sm:bottom-6"
    >
      {toasts.map((item) => (
        <toastComponents.toast key={item.id} toast={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  )
})
