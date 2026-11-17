import { useNavigate } from 'react-router'
import type { ShellUser } from '@/components/layout/siteHeader'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { getRoleLabel } from '../model/roleLabels'

interface ShellSession {
  user?: ShellUser
  onLogout?: () => void
}

const getUserInitials = (
  firstName: string | null,
  lastName: string | null,
  email: string | null,
) => {
  const nameParts = [firstName, lastName].filter((name): name is string => Boolean(name))

  if (nameParts.length > 0) {
    return nameParts
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
  }

  return (email?.split('@')[0] ?? 'U').slice(0, 2).toUpperCase()
}

/**
 * Builds the shell identity from the persisted session, so every page that
 * renders `appShell` outside a protected route keeps the same header.
 */
export const useShellSession = (): ShellSession => {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const email = useAuthStore((state) => state.email)
  const roles = useAuthStore((state) => state.roles)
  const firstName = useAuthStore((state) => state.firstName)
  const lastName = useAuthStore((state) => state.lastName)
  const clearSession = useAuthStore((state) => state.clearSession)

  if (!token) {
    return {}
  }

  const user: ShellUser = {
    name: [firstName, lastName].filter(Boolean).join(' ') || email || 'Usuario',
    initials: getUserInitials(firstName, lastName, email),
    role: getRoleLabel(roles),
    roles,
  }

  const onLogout = () => {
    clearSession()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return { user, onLogout }
}
