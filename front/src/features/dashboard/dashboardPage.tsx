/* oxlint-disable react/rules-of-hooks */
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import {
  LuCalendarDays as luCalendarDays,
  LuCog as luCog,
  LuDumbbell as luDumbbell,
  LuPackage as luPackage,
  LuPlus as luPlus,
  LuReceipt as luReceipt,
  LuUsers as luUsers,
} from 'react-icons/lu'
import { Link } from 'react-router'
import * as componentComponents from '@/components'
import { buttonClassName } from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/features/clients/model/clientFormatting'
import {
  dashboardLedes,
  formatDashboardToday,
  readMembership,
} from './model/dashboardModel'
import { useDashboardData } from './hooks/useDashboardData'
import * as dashboardPanelComponents from './components/dashboardPanels'
import './components/dashboardFeature.css'

type QueryTotalSource = {
  isPending: boolean
  isError: boolean
  data?: { totalElements: number }
}

interface StatCardProps {
  icon: IconType
  label: string
  value: ReactNode
  delta: ReactNode
}

interface Shortcut {
  to: string
  label: string
  hint: string
  icon: IconType
}

const queryTotal = (query: QueryTotalSource): string | number =>
  query.isPending || query.isError ? '—' : (query.data?.totalElements ?? 0)

const planMetric = (
  membership: ReturnType<typeof useDashboardData>['membershipQuery']['data'],
): { value: string; delta: string } => {
  if (membership === undefined) return { value: '—', delta: 'Cargando vigencia…' }
  if (membership === null) return { value: 'Sin plan', delta: 'Sin membresía activa' }

  const reading = readMembership(membership)
  const progress = reading.progress

  if (progress.state === 'active') {
    return {
      value: `${progress.daysRemaining} d`,
      delta: `Hasta el ${formatDate(membership.endDate)}`,
    }
  }

  if (progress.state === 'upcoming') {
    return {
      value: `${progress.daysUntilStart} d`,
      delta: `Desde el ${formatDate(membership.startDate)}`,
    }
  }

  return { value: 'Vencido', delta: reading.label }
}

const statCard = ({ icon, label, value, delta }: StatCardProps) => (
  <article className="dashboardFeature__stat">
    <span className="dashboardFeature__statIcon">
      <componentComponents.icon icon={icon} size="md" />
    </span>
    <div className="dashboardFeature__statBody">
      <p className="dashboardFeature__statLabel">{label}</p>
      <p className="dashboardFeature__statValue">{value}</p>
      <p className="dashboardFeature__statDelta">{delta}</p>
    </div>
  </article>
)

const sectionHead = (title: string, meta?: string, first = false) => (
  <div
    className={
      first
        ? 'dashboardFeature__section dashboardFeature__section--first'
        : 'dashboardFeature__section'
    }
  >
    <h2 className="dashboardFeature__sectionTitle">{title}</h2>
    {meta && <span className="dashboardFeature__sectionMeta">{meta}</span>}
  </div>
)

const getShortcuts = (view: string, clientId: number | null): Shortcut[] => {
  if (view === 'admin') {
    return [
      { to: '/clients', label: 'Clientes', hint: 'Directorio, fichas y membresías.', icon: luUsers },
      { to: '/payments', label: 'Pagos', hint: 'Cobra y revisa movimientos.', icon: luReceipt },
      { to: '/inventory', label: 'Inventario', hint: 'Stock y reposición de insumos.', icon: luPackage },
      { to: '/machines', label: 'Máquinas', hint: 'Estado y mantenimiento.', icon: luCog },
      { to: '/routines', label: 'Rutinas', hint: 'Catálogo y asignaciones.', icon: luDumbbell },
      { to: '/schedules', label: 'Horarios', hint: 'Mallas semanales del equipo.', icon: luCalendarDays },
    ]
  }

  if (view === 'reception') {
    return [
      { to: '/clients', label: 'Clientes', hint: 'Directorio, fichas y membresías.', icon: luUsers },
      { to: '/payments', label: 'Pagos', hint: 'Cobra y revisa movimientos.', icon: luReceipt },
      { to: '/routines', label: 'Rutinas', hint: 'Catálogo disponible para asignar.', icon: luDumbbell },
    ]
  }

  if (view === 'manager') {
    return [
      { to: '/schedules', label: 'Horarios', hint: 'Planifica la malla del equipo.', icon: luCalendarDays },
      { to: '/inventory', label: 'Inventario', hint: 'Stock y reposición de insumos.', icon: luPackage },
      { to: '/machines', label: 'Máquinas', hint: 'Estado y mantenimiento.', icon: luCog },
      { to: '/routines', label: 'Rutinas', hint: 'Catálogo y asignaciones.', icon: luDumbbell },
    ]
  }

  if (view === 'trainer') {
    return [
      { to: '/schedules', label: 'Mi horario', hint: 'Tu disponibilidad, solo lectura.', icon: luCalendarDays },
      { to: '/inventory', label: 'Inventario', hint: 'Stock y reposición de insumos.', icon: luPackage },
      { to: '/machines', label: 'Máquinas', hint: 'Estado y mantenimiento.', icon: luCog },
      { to: '/routines', label: 'Rutinas', hint: 'Catálogo y asignaciones.', icon: luDumbbell },
    ]
  }

  return [
    { to: '/routines', label: 'Mis rutinas', hint: 'Tu plan de entrenamiento.', icon: luDumbbell },
    ...(clientId === null
      ? []
      : [{ to: `/clients/${clientId}`, label: 'Mi ficha', hint: 'Tus datos y membresía.', icon: luUsers }]),
  ]
}

export const dashboardPage = () => {
  const data = useDashboardData()
  const firstName = useAuthStore((state) => state.firstName)
  const view = data.flags.view
  const membership = data.membershipQuery.data

  const metrics = () => {
    switch (view) {
      case 'admin':
        return (
          <>
            {statCard({
              icon: luUsers,
              label: 'Clientes registrados',
              value: queryTotal(data.clientsQuery),
              delta: 'Directorio completo',
            })}
            {statCard({
              icon: luPackage,
              label: 'Insumos en stock bajo',
              value: queryTotal(data.lowStockQuery),
              delta: 'Requieren reposición',
            })}
            {statCard({
              icon: luCog,
              label: 'Máquinas en mantenimiento',
              value: queryTotal(data.maintenanceMachinesQuery),
              delta: `${queryTotal(data.availableMachinesQuery)} disponibles`,
            })}
          </>
        )
      case 'reception':
        return (
          <>
            {statCard({
              icon: luUsers,
              label: 'Clientes registrados',
              value: queryTotal(data.clientsQuery),
              delta: 'Directorio completo',
            })}
            {statCard({
              icon: luDumbbell,
              label: 'Rutinas generales',
              value: queryTotal(data.generalRoutinesQuery),
              delta: 'Disponibles para asignar',
            })}
            {statCard({
              icon: luDumbbell,
              label: 'Rutinas personalizadas',
              value: queryTotal(data.customRoutinesQuery),
              delta: 'Creadas por entrenadores',
            })}
          </>
        )
      case 'manager':
        return (
          <>
            {statCard({
              icon: luPackage,
              label: 'Insumos en stock bajo',
              value: queryTotal(data.lowStockQuery),
              delta: 'Requieren reposición',
            })}
            {statCard({
              icon: luCog,
              label: 'Máquinas en mantenimiento',
              value: queryTotal(data.maintenanceMachinesQuery),
              delta: `${queryTotal(data.availableMachinesQuery)} disponibles`,
            })}
            {statCard({
              icon: luUsers,
              label: 'Entrenadores',
              value: queryTotal(data.teamQuery),
              delta: 'Equipo registrado',
            })}
          </>
        )
      case 'trainer':
        return (
          <>
            {statCard({
              icon: luPackage,
              label: 'Insumos en stock bajo',
              value: queryTotal(data.lowStockQuery),
              delta: 'Requieren reposición',
            })}
            {statCard({
              icon: luCog,
              label: 'Máquinas en mantenimiento',
              value: queryTotal(data.maintenanceMachinesQuery),
              delta: `${queryTotal(data.availableMachinesQuery)} disponibles`,
            })}
            {statCard({
              icon: luDumbbell,
              label: 'Rutinas en catálogo',
              value: queryTotal(data.routinesQuery),
              delta: 'Generales y personalizadas',
            })}
          </>
        )
      case 'client': {
        const plan = planMetric(membership)
        return (
          <>
            {statCard({
              icon: luCalendarDays,
              label: 'Vigencia del plan',
              value: plan.value,
              delta: plan.delta,
            })}
            {statCard({
              icon: luDumbbell,
              label: 'Rutinas asignadas',
              value: queryTotal(data.clientRoutinesQuery),
              delta: 'Incluye activas y cerradas',
            })}
            {statCard({
              icon: luReceipt,
              label: 'Pagos registrados',
              value: queryTotal(data.clientPaymentsQuery),
              delta: 'Últimos movimientos abajo',
            })}
          </>
        )
      }
    }
  }

  const quickActions = () => {
    if (view === 'admin' || view === 'reception') {
      return (
        <>
          <Link to="/clients/new" className={buttonClassName('primary', 'md')}>
            <componentComponents.icon icon={luPlus} size="sm" />
            Nuevo cliente
          </Link>
          <Link to="/payments" className={buttonClassName('default', 'md')}>
            <componentComponents.icon icon={luReceipt} size="sm" />
            Registrar pago
          </Link>
        </>
      )
    }

    if (view === 'manager' || view === 'trainer') {
      return (
        <>
          <Link to="/schedules" className={buttonClassName('primary', 'md')}>
            <componentComponents.icon icon={luCalendarDays} size="sm" />
            {view === 'manager' ? 'Planear horarios' : 'Ver mi horario'}
          </Link>
          <Link to="/inventory" className={buttonClassName('default', 'md')}>
            <componentComponents.icon icon={luPackage} size="sm" />
            Revisar stock
          </Link>
        </>
      )
    }

    return (
      <>
        <Link to="/routines" className={buttonClassName('primary', 'md')}>
          <componentComponents.icon icon={luDumbbell} size="sm" />
          Ver mis rutinas
        </Link>
        {data.clientId !== null && (
          <Link to={`/clients/${data.clientId}`} className={buttonClassName('default', 'md')}>
            Mi ficha
          </Link>
        )}
      </>
    )
  }

  const mainPanel = () => {
    switch (view) {
      case 'admin':
      case 'reception':
        return <dashboardPanelComponents.clientsPanel query={data.clientsQuery} />
      case 'manager':
        return <dashboardPanelComponents.teamPanel query={data.teamQuery} />
      case 'trainer':
        return <dashboardPanelComponents.weekPanel query={data.weekQuery} />
      case 'client':
        return <dashboardPanelComponents.myRoutinesPanel query={data.clientRoutinesQuery} />
    }
  }

  const sidePanels = () => {
    switch (view) {
      case 'admin':
        return (
          <>
            <dashboardPanelComponents.lowStockPanel query={data.lowStockQuery} />
            <dashboardPanelComponents.machinesPanel
              available={data.availableMachinesQuery}
              maintenance={data.maintenanceMachinesQuery}
              outOfService={data.outOfServiceMachinesQuery}
            />
          </>
        )
      case 'reception':
        return (
          <dashboardPanelComponents.routinesPanel
            query={data.routinesQuery}
            generalCount={data.generalRoutinesQuery.data?.totalElements ?? 0}
            customCount={data.customRoutinesQuery.data?.totalElements ?? 0}
          />
        )
      case 'manager':
      case 'trainer':
        return (
          <>
            <dashboardPanelComponents.lowStockPanel query={data.lowStockQuery} />
            <dashboardPanelComponents.machinesPanel
              available={data.availableMachinesQuery}
              maintenance={data.maintenanceMachinesQuery}
              outOfService={data.outOfServiceMachinesQuery}
            />
          </>
        )
      case 'client':
        return (
          <>
            <dashboardPanelComponents.planPanel
              query={data.membershipQuery}
              clientId={data.clientId}
            />
            <dashboardPanelComponents.myPaymentsPanel query={data.clientPaymentsQuery} />
          </>
        )
    }
  }

  const visibleShortcuts = getShortcuts(view, data.clientId)

  return (
    <>
      <componentComponents.pageHead
        title={firstName ? `Buenas, ${firstName}` : 'Panel'}
        lede={`${formatDashboardToday()} · ${dashboardLedes[view]}`}
        actions={quickActions()}
      />

      {sectionHead('Resumen', undefined, true)}
      <div className="dashboardFeature__stats">{metrics()}</div>

      {sectionHead('Tu operación', 'Paneles según tu rol')}
      <div className="dashboardFeature__grid">
        <div className="dashboardFeature__main">{mainPanel()}</div>
        <div className="dashboardFeature__side">{sidePanels()}</div>
      </div>

      {sectionHead('Accesos rápidos', 'Según tu rol')}
      <nav className="dashboardFeature__shortcuts" aria-label="Accesos rápidos">
        {visibleShortcuts.map((shortcut) => (
          <Link
            key={`${shortcut.to}-${shortcut.label}`}
            to={shortcut.to}
            className="dashboardFeature__shortcut"
          >
            <span className="dashboardFeature__shortcutIcon">
              <componentComponents.icon icon={shortcut.icon} size="md" />
            </span>
            <span className="dashboardFeature__shortcutBody">
              <span className="dashboardFeature__shortcutLabel">{shortcut.label}</span>
              <span className="dashboardFeature__shortcutHint">{shortcut.hint}</span>
            </span>
            <span className="dashboardFeature__shortcutArrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
