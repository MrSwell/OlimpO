// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { lazy, Suspense as suspense } from 'react'
import {
  BrowserRouter as browserRouter,
  Navigate as navigate,
  Route as route,
  Routes as routes,
} from 'react-router'
import * as appProviderComponents from '@/app/providers'
import * as components from '@/components'
import * as homePageComponents from '@/features/home/publicHomePage'
import * as authPageComponents from '@/features/auth/components/loginPage'
import * as authSessionComponents from '@/features/auth/components/authSessionManager'
import * as protectedRouteComponents from '@/features/auth/components/protectedRoute'
import * as clientsPageComponents from '@/features/clients/components/clientsPage'
import * as clientCreatePageComponents from '@/features/clients/components/clientCreatePage'
import * as clientDetailPageComponents from '@/features/clients/components/clientDetailPage'
import * as dashboardComponents from '@/features/dashboard/dashboardPage'
import * as plannedFeatureComponents from '@/features/dashboard/plannedFeaturePage'
import * as shellSessionComponents from '@/features/auth/hooks/useShellSession'
import { roleGroups, type UserRole } from '@/features/auth/model/authTypes'

const reactComponents = { lazy, suspense }
const routerComponents = { browserRouter, navigate, route, routes }

const designPageComponents = import.meta.env.DEV
  ? {
      designPage: reactComponents.lazy(async () => {
        const designPageModule = await import('@/app/designPage')
        return { default: designPageModule.designPage }
      }),
    }
  : null

const plannedPage = (
  title: string,
  phase: string,
  description: string,
  roles: readonly UserRole[],
) => {
  return (
    <protectedRouteComponents.protectedRoute allowedRoles={roles}>
      <plannedFeatureComponents.plannedFeaturePage
        title={title}
        phase={phase}
        description={description}
      />
    </protectedRouteComponents.protectedRoute>
  )
}

const notFoundPage = () => {
  const shellSession = shellSessionComponents.useShellSession()

  return (
    <components.appShell user={shellSession.user} onLogout={shellSession.onLogout}>
      <components.pageHead title="Página no encontrada" />
      <components.panel>
        <components.emptyState
          title="No encontramos esta página"
          description="Verifica la dirección o vuelve al inicio."
        />
      </components.panel>
    </components.appShell>
  )
}

const pageComponents = { notFoundPage }

const app = () => {
  return (
    <appProviderComponents.appProviders>
      <routerComponents.browserRouter>
        <authSessionComponents.authSessionManager />
        <routerComponents.routes>
          <routerComponents.route path="/" element={<homePageComponents.publicHomePage />} />
          <routerComponents.route path="/login" element={<authPageComponents.loginPage />} />
          <routerComponents.route
            path="/dashboard"
            element={
              <protectedRouteComponents.protectedRoute allowedRoles={roleGroups.all}>
                <dashboardComponents.dashboardPage />
              </protectedRouteComponents.protectedRoute>
            }
          />
          <routerComponents.route
            path="/clients"
            element={
              <protectedRouteComponents.protectedRoute allowedRoles={roleGroups.clientManagement}>
                <clientsPageComponents.clientsPage />
              </protectedRouteComponents.protectedRoute>
            }
          />
          <routerComponents.route
            path="/clients/new"
            element={
              <protectedRouteComponents.protectedRoute allowedRoles={roleGroups.clientManagement}>
                <clientCreatePageComponents.clientCreatePage />
              </protectedRouteComponents.protectedRoute>
            }
          />
          <routerComponents.route
            path="/clients/:clientId"
            element={
              <protectedRouteComponents.protectedRoute allowedRoles={roleGroups.clientRecord}>
                <clientDetailPageComponents.clientDetailPage />
              </protectedRouteComponents.protectedRoute>
            }
          />
          <routerComponents.route
            path="/payments"
            element={plannedPage(
              'Pagos',
              'F4',
              'El registro y el historial de pagos estarán disponibles en la fase F4.',
              roleGroups.clientManagement,
            )}
          />
          <routerComponents.route
            path="/inventory"
            element={plannedPage(
              'Inventario',
              'F5',
              'La operación de inventario estará disponible en la fase F5.',
              roleGroups.trainingStaff,
            )}
          />
          <routerComponents.route
            path="/schedules"
            element={plannedPage(
              'Horarios',
              'F6',
              'La administración de horarios estará disponible en la fase F6.',
              roleGroups.trainingStaff,
            )}
          />
          <routerComponents.route
            path="/users"
            element={plannedPage(
              'Usuarios',
              'F7',
              'La administración de usuarios estará disponible en la fase F7.',
              ['ADMIN'],
            )}
          />
          {designPageComponents && (
            <routerComponents.route
              path="/design"
              element={
                <reactComponents.suspense fallback={null}>
                  <designPageComponents.designPage />
                </reactComponents.suspense>
              }
            />
          )}
          <routerComponents.route path="*" element={<pageComponents.notFoundPage />} />
          {!import.meta.env.DEV && (
            <routerComponents.route
              path="/design"
              element={<routerComponents.navigate to="/" replace />}
            />
          )}
        </routerComponents.routes>
        <components.toastHost />
      </routerComponents.browserRouter>
    </appProviderComponents.appProviders>
  )
}

export default app
