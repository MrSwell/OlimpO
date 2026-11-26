// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { lazy, Suspense as suspense, type ComponentType, type ReactNode } from 'react'
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
import * as shellSessionComponents from '@/features/auth/hooks/useShellSession'
import { roleGroups, type UserRole } from '@/features/auth/model/authTypes'

const reactComponents = { lazy, suspense }
const routerComponents = { browserRouter, navigate, route, routes }

/**
 * Each feature page is its own chunk: the landing and the login stay in the
 * initial bundle, everything behind the session guard loads on demand.
 */
const lazyFeaturePage = <TModule extends Record<string, unknown>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule,
) =>
  reactComponents.lazy(async () => {
    const module = await loader()
    return { default: module[exportName] as ComponentType }
  })

const pageComponents = {
  dashboardPage: lazyFeaturePage(
    () => import('@/features/dashboard/dashboardPage'),
    'dashboardPage',
  ),
  clientsPage: lazyFeaturePage(
    () => import('@/features/clients/components/clientsPage'),
    'clientsPage',
  ),
  clientCreatePage: lazyFeaturePage(
    () => import('@/features/clients/components/clientCreatePage'),
    'clientCreatePage',
  ),
  clientDetailPage: lazyFeaturePage(
    () => import('@/features/clients/components/clientDetailPage'),
    'clientDetailPage',
  ),
  paymentsPage: lazyFeaturePage(
    () => import('@/features/payments/components/paymentsPage'),
    'paymentsPage',
  ),
  inventoryPage: lazyFeaturePage(
    () => import('@/features/inventory/components/inventoryPage'),
    'inventoryPage',
  ),
  itemDetailPage: lazyFeaturePage(
    () => import('@/features/inventory/components/itemDetailPage'),
    'itemDetailPage',
  ),
  machinesPage: lazyFeaturePage(
    () => import('@/features/machines/components/machinesPage'),
    'machinesPage',
  ),
  schedulesPage: lazyFeaturePage(
    () => import('@/features/schedules/components/schedulesPage'),
    'schedulesPage',
  ),
  routinesPage: lazyFeaturePage(
    () => import('@/features/routines/components/routinesPage'),
    'routinesPage',
  ),
  routineDetailPage: lazyFeaturePage(
    () => import('@/features/routines/components/routineDetailPage'),
    'routineDetailPage',
  ),
  usersPage: lazyFeaturePage(
    () => import('@/features/users/components/usersPage'),
    'usersPage',
  ),
}

const designPageComponents = import.meta.env.DEV
  ? {
      designPage: reactComponents.lazy(async () => {
        const designPageModule = await import('@/app/designPage')
        return { default: designPageModule.designPage }
      }),
    }
  : null

const routeFallback = (
  <div role="status" aria-live="polite" className="flex justify-center py-24">
    <p className="text-[13px] text-muted">Cargando…</p>
  </div>
)

const lazyPage = (allowedRoles: readonly UserRole[], children: ReactNode) => (
  <protectedRouteComponents.protectedRoute allowedRoles={allowedRoles}>
    <reactComponents.suspense fallback={routeFallback}>{children}</reactComponents.suspense>
  </protectedRouteComponents.protectedRoute>
)

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
            element={lazyPage(roleGroups.all, <pageComponents.dashboardPage />)}
          />
          <routerComponents.route
            path="/clients"
            element={lazyPage(roleGroups.clientManagement, <pageComponents.clientsPage />)}
          />
          <routerComponents.route
            path="/clients/new"
            element={lazyPage(roleGroups.clientManagement, <pageComponents.clientCreatePage />)}
          />
          <routerComponents.route
            path="/clients/:clientId"
            element={lazyPage(roleGroups.clientRecord, <pageComponents.clientDetailPage />)}
          />
          <routerComponents.route
            path="/payments"
            element={lazyPage(roleGroups.clientManagement, <pageComponents.paymentsPage />)}
          />
          <routerComponents.route
            path="/inventory"
            element={lazyPage(roleGroups.trainingStaff, <pageComponents.inventoryPage />)}
          />
          <routerComponents.route
            path="/inventory/:itemId"
            element={lazyPage(roleGroups.trainingStaff, <pageComponents.itemDetailPage />)}
          />
          <routerComponents.route
            path="/machines"
            element={lazyPage(roleGroups.trainingStaff, <pageComponents.machinesPage />)}
          />
          <routerComponents.route
            path="/schedules"
            element={lazyPage(roleGroups.trainingStaff, <pageComponents.schedulesPage />)}
          />
          <routerComponents.route
            path="/routines"
            element={lazyPage(roleGroups.all, <pageComponents.routinesPage />)}
          />
          <routerComponents.route
            path="/routines/:routineId"
            element={lazyPage(roleGroups.all, <pageComponents.routineDetailPage />)}
          />
          <routerComponents.route
            path="/users"
            element={lazyPage(['ADMIN'], <pageComponents.usersPage />)}
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
          <routerComponents.route path="*" element={<notFoundPage />} />
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
