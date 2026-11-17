import { create } from 'zustand'

export type ToastTone = 'error' | 'success' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  tone: ToastTone
  duration: number
}

export type ToastInput = Omit<ToastItem, 'id' | 'duration'> & {
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  push: (toast: ToastInput) => string
  dismiss: (id: string) => void
  clear: () => void
}

const DEFAULT_DURATION: Record<ToastTone, number> = {
  error: 8000,
  success: 5000,
  info: 5000,
}

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = createId()
    const item: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? DEFAULT_DURATION[toast.tone],
    }
    set((state) => ({ toasts: [...state.toasts, item] }))
    return id
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

export const toast = {
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: 'error' }),
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: 'success' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: 'info' }),
}
