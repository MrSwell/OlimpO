// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import type { ReactNode } from 'react'
import { Navigate as navigate, useLocation } from 'react-router'
import * as componentComponents from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { useShellSession } from '../hooks/useShellSession'
import type { UserRole } from '../model/authTypes'

const routerComponents = { navigate }

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: readonly UserRole[]
}

export const protectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const roles = useAuthStore((state) => state.roles)
  const shellSession = useShellSession()

  if (!token) {
    return <routerComponents.navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !roles.some((role) => allowedRoles.includes(role))) {
    return (
      <componentComponents.appShell user={shellSession.user} onLogout={shellSession.onLogout}>
        <componentComponents.pageHead title="Acceso denegado" />
        <componentComponents.panel>
          <componentComponents.emptyState
            title="No tienes permiso para esta sección"
            description="Tu cuenta no tiene un rol habilitado para acceder aquí."
          />
        </componentComponents.panel>
      </componentComponents.appShell>
    )
  }

  return (
    <componentComponents.appShell user={shellSession.user} onLogout={shellSession.onLogout}>
      {children}
    </componentComponents.appShell>
  )
}
