// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, authExpiredEventName, refreshAuthSession } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import { getCurrentUser } from '../api/authApi'

export const authSessionManager = () => {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const expiresAt = useAuthStore((state) => state.expiresAt)
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)

  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.clear()
      toast.info('La sesión finalizó', 'Inicia sesión de nuevo para continuar.')
      navigate('/login', { replace: true })
    }

    window.addEventListener(authExpiredEventName, handleSessionExpired)
    return () => window.removeEventListener(authExpiredEventName, handleSessionExpired)
  }, [navigate])

  useEffect(() => {
    if (!token || expiresAt === null) {
      return
    }

    let active = true
    const remainingMs = Math.max(0, expiresAt - Date.now())
    const expiryDelay = remainingMs
    // Refresh at 90% of the token lifetime, capped at one minute. A token that
    // lives 5s or less is left to the expiry timer instead of being refreshed,
    // so a short `expiresIn` can never schedule back-to-back refreshes.
    const minimumRefreshWindowMs = 5_000
    const refreshMarginMs = Math.min(60_000, Math.floor(remainingMs / 10))
    const refreshDelay = Math.max(0, remainingMs - refreshMarginMs)
    const shouldRefresh = remainingMs > minimumRefreshWindowMs

    const refreshTimer = shouldRefresh
      ? window.setTimeout(() => {
          void refreshAuthSession().catch((error: unknown) => {
            if (!active || (error instanceof ApiError && error.status === 401)) {
              return
            }

            const description =
              error instanceof ApiError
                ? error.message
                : 'Comprueba tu conexión; la sesión se cerrará cuando venza el token.'
            toast.error('No se pudo renovar la sesión', description)
          })
        }, refreshDelay)
      : undefined

    const expiryTimer = window.setTimeout(() => {
      const currentSession = useAuthStore.getState()

      if (currentSession.token !== token || currentSession.expiresAt !== expiresAt) {
        return
      }

      currentSession.clearSession()
      queryClient.clear()
      toast.info('La sesión venció', 'Inicia sesión de nuevo para continuar.')
      navigate('/login', { replace: true })
    }, expiryDelay)

    void getCurrentUser()
      .then((user) => {
        if (active) {
          setCurrentUser(user)
        }
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof ApiError && error.status === 401)) {
          return
        }

        const description =
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.'
        toast.error('No se pudo validar la sesión', description)
      })

    return () => {
      active = false
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer)
      window.clearTimeout(expiryTimer)
    }
  }, [expiresAt, navigate, setCurrentUser, token])

  return null
}
