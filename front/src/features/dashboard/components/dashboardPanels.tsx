import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import {
  LuCalendarDays as luCalendarDays,
  LuCog as luCog,
  LuCreditCard as luCreditCard,
  LuDumbbell as luDumbbell,
  LuPackage as luPackage,
  LuReceipt as luReceipt,
  LuUsers as luUsers,
} from 'react-icons/lu'
import { Link } from 'react-router'
import * as componentComponents from '@/components'
import { buttonClassName } from '@/components'
import type {
  ClientsPageResponse,
  MembershipResponse,
  PaymentsPageResponse,
} from '@/features/clients/model/clientTypes'
import {
  clientStatusLabel,
  membershipStatusLabels,
  membershipTypeLabels,
  paymentMethodLabels,
} from '@/features/clients/model/clientTypes'
import { formatDate, formatMoney } from '@/features/clients/model/clientFormatting'
import type { InventoryItemsPage } from '@/features/inventory/model/inventoryTypes'
import { formatStock } from '@/features/inventory/model/inventoryTypes'
import type { MachinesPage } from '@/features/machines/model/machineTypes'
import type { RoutineAssignmentsPage, RoutinesPage } from '@/features/routines/model/routineTypes'
import {
  routineAssignmentStatusLabels,
  routineTypeLabels,
} from '@/features/routines/model/routineTypes'
import type { ScheduleSlot } from '@/features/schedules/model/scheduleTypes'
import { scheduleStatusLabels } from '@/features/schedules/model/scheduleTypes'
import type { TrainerOptionsPage } from '@/features/trainers/model/trainerTypes'
import { readMembership, sortScheduleSlots } from '../model/dashboardModel'

const panelAction = (to: string, label: string) => (
  <Link className="dashboardFeature__panelAction" to={to}>
    {label}
  </Link>
)

const retryButton = (onRetry: () => void) => (
  <componentComponents.button variant="quiet" size="sm" onClick={onRetry}>
    Reintentar
  </componentComponents.button>
)

interface PanelStateProps {
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  emptyAction?: ReactNode
  onRetry: () => void
  children: ReactNode
}

const panelEmpty = ({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) => (
  <div className="dashboardFeature__empty">
    <p className="dashboardFeature__emptyTitle">{title}</p>
    <p className="dashboardFeature__emptyText">{description}</p>
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
)

const panelState = ({
  isPending,
  isError,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRetry,
  children,
}: PanelStateProps) => {
  if (isPending) {
    return <p className="dashboardFeature__state">Cargando información…</p>
  }

  if (isError) {
    return (
      <div className="dashboardFeature__state">
        <p>No se pudo cargar esta información.</p>
        <div className="mt-2">{retryButton(onRetry)}</div>
      </div>
    )
  }

  if (isEmpty) {
    return <localComponents.panelEmpty title={emptyTitle} description={emptyDescription} action={emptyAction} />
  }

  return <>{children}</>
}

const pageNote = (visible: boolean, children: ReactNode) =>
  visible ? <p className="dashboardFeature__note">{children}</p> : null

interface ClientsPanelProps {
  query: UseQueryResult<ClientsPageResponse>
}

export const clientsPanel = ({ query }: ClientsPanelProps) => {
  const data = query.data

  return (
    <componentComponents.panel>
      <componentComponents.panelHead
        icon={luUsers}
        title="Clientes registrados"
        action={panelAction('/clients', 'Ver todos')}
      />
      <localComponents.panelState
        isPending={query.isPending}
        isError={query.isError}
        isEmpty={(data?.content.length ?? 0) === 0}
        emptyTitle="Aún no hay clientes"
        emptyDescription="Crea el primer cliente para empezar a registrar membresías y pagos."
        emptyAction={
          <Link to="/clients/new" className={buttonClassName('default', 'sm')}>
            Crear cliente
          </Link>
        }
        onRetry={() => void query.refetch()}
      >
        <componentComponents.rows>
          {data?.content.map((client) => (
            <componentComponents.row
              key={client.id}
              title={
                <Link to={`/clients/${client.id}`}>
                  {client.firstName} {client.lastName}
                </Link>
              }
              meta={<span className="break-all">{client.email}</span>}
              end={
                <componentComponents.status tone={client.status === 'ACTIVE' ? 'ok' : 'neutral'}>
                  {clientStatusLabel(client.status)}
                </componentComponents.status>
              }
            />
          ))}
        </componentComponents.rows>
        {pageNote(
          Boolean(data && data.totalElements > data.content.length),
          `Mostrando ${data?.content.length ?? 0} de ${data?.totalElements ?? 0} clientes.`,
        )}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}

interface LowStockPanelProps {
  query: UseQueryResult<InventoryItemsPage>
}

export const lowStockPanel = ({ query }: LowStockPanelProps) => {
  const data = query.data

  return (
    <componentComponents.panel>
      <componentComponents.panelHead
        icon={luPackage}
        title="Stock bajo"
        action={panelAction('/inventory', 'Ver inventario')}
      />
      <localComponents.panelState
        isPending={query.isPending}
        isError={query.isError}
        isEmpty={(data?.content.length ?? 0) === 0}
        emptyTitle="Inventario al día"
        emptyDescription="Ningún insumo está por debajo de su mínimo definido."
        onRetry={() => void query.refetch()}
      >
        <componentComponents.rows>
          {data?.content.map((item) => (
            <componentComponents.row
              key={item.id}
              title={<Link to={`/inventory/${item.id}`}>{item.name}</Link>}
              meta={`Mínimo ${item.minStock}`}
              end={
                <componentComponents.status tone="warn">
                  {formatStock(item)}
                </componentComponents.status>
              }
            />
          ))}
        </componentComponents.rows>
        {pageNote(
          Boolean(data && data.totalElements > data.content.length),
          `Mostrando ${data?.content.length ?? 0} de ${data?.totalElements ?? 0} insumos.`,
        )}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}

interface MachinesPanelProps {
  available: UseQueryResult<MachinesPage>
  maintenance: UseQueryResult<MachinesPage>
  outOfService: UseQueryResult<MachinesPage>
}

export const machinesPanel = ({ available, maintenance, outOfService }: MachinesPanelProps) => {
  const queries = [available, maintenance, outOfService]
  const isPending = queries.some((query) => query.isPending)
  const isError = queries.some((query) => query.isError)
  const total = queries.reduce((sum, query) => sum + (query.data?.totalElements ?? 0), 0)
  const count = (query: UseQueryResult<MachinesPage>) => query.data?.totalElements ?? 0

  return (
    <componentComponents.panel>
      <componentComponents.panelHead
        icon={luCog}
        title="Máquinas"
        action={panelAction('/machines', 'Ver máquinas')}
      />
      <localComponents.panelState
        isPending={isPending}
        isError={isError}
        isEmpty={total === 0}
        emptyTitle="Sin máquinas registradas"
        emptyDescription="Registra las máquinas del gimnasio para seguir su estado."
        emptyAction={
          <Link to="/machines" className={buttonClassName('default', 'sm')}>
            Registrar máquina
          </Link>
        }
        onRetry={() => {
          queries.forEach((query) => void query.refetch())
        }}
      >
        <componentComponents.rows>
          <componentComponents.row
            title="Disponibles"
            end={
              <componentComponents.status tone="ok">{count(available)}</componentComponents.status>
            }
          />
          <componentComponents.row
            title="En mantenimiento"
            end={
              <componentComponents.status tone="warn">
                {count(maintenance)}
              </componentComponents.status>
            }
          />
          <componentComponents.row
            title="Fuera de servicio"
            end={
              <componentComponents.status tone="danger">
                {count(outOfService)}
              </componentComponents.status>
            }
          />
        </componentComponents.rows>
        {pageNote(total > 0, `${total} ${total === 1 ? 'máquina registrada' : 'máquinas registradas'}.`)}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}

interface RoutinesPanelProps {
  query: UseQueryResult<RoutinesPage>
  generalCount: number
  customCount: number
}

export const routinesPanel = ({ query, generalCount, customCount }: RoutinesPanelProps) => {
  const data = query.data

  return (
    <componentComponents.panel>
      <componentComponents.panelHead
        icon={luDumbbell}
        title="Catálogo de rutinas"
        action={panelAction('/routines', 'Ver rutinas')}
      />
      <localComponents.panelState
        isPending={query.isPending}
        isError={query.isError}
        isEmpty={(data?.content.length ?? 0) === 0}
        emptyTitle="Catálogo vacío"
        emptyDescription="Crea la primera rutina general o personalizada del gimnasio."
        emptyAction={
          <Link to="/routines" className={buttonClassName('default', 'sm')}>
            Ir a rutinas
          </Link>
        }
        onRetry={() => void query.refetch()}
      >
        <componentComponents.rows>
          {data?.content.map((routine) => (
            <componentComponents.row
              key={routine.id}
              title={<Link to={`/routines/${routine.id}`}>{routine.name}</Link>}
              meta={routine.trainerName ?? routineTypeLabels[routine.type]}
              end={routine.price === null ? '—' : formatMoney(routine.price)}
            />
          ))}
        </componentComponents.rows>
        {pageNote(
          true,
          `${generalCount} ${generalCount === 1 ? 'general' : 'generales'} · ${customCount} ${customCount === 1 ? 'personalizada' : 'personalizadas'}`,
        )}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}

interface TeamPanelProps {
  query: UseQueryResult<TrainerOptionsPage>
}

export const teamPanel = ({ query }: TeamPanelProps) => {
  const data = query.data

  return (
    <componentComponents.panel>
      <componentComponents.panelHead
        icon={luUsers}
        title="Equipo"
        action={panelAction('/schedules', 'Planear horarios')}
      />
      <localComponents.panelState
        isPending={query.isPending}
        isError={query.isError}
        isEmpty={(data?.content.length ?? 0) === 0}
        emptyTitle="Sin entrenadores"
        emptyDescription="El equipo aparecerá aquí cuando haya perfiles de entrenador registrados."
        onRetry={() => void query.refetch()}
      >
        <componentComponents.rows>
          {data?.content.map((trainer) => (
            <componentComponents.row
              key={trainer.id}
              title={`${trainer.firstName} ${trainer.lastName}`}
              meta={trainer.specialty ?? 'Entrenador'}
            />
          ))}
        </componentComponents.rows>
        {pageNote(
          Boolean(data && data.totalElements > data.content.length),
          `Mostrando ${data?.content.length ?? 0} de ${data?.totalElements ?? 0} entrenadores.`,
        )}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}

const scheduleTone = {
  AVAILABLE: 'ok',
  NOT_AVAILABLE: 'warn',
  RESERVED: 'neutral',
} as const

interface WeekPanelProps {
  query: UseQueryResult<ScheduleSlot[]>
}

export const weekPanel = ({ query }: WeekPanelProps) => {
  const slots = query.data ? sortScheduleSlots(query.data) : []

  return (
    <componentComponents.panel>
      <componentComponents.panelHead
        icon={luCalendarDays}
        title="Mi semana"
        action={panelAction('/schedules', 'Ver horario')}
      />
      <localComponents.panelState
        isPending={query.isPending}
        isError={query.isError}
        isEmpty={slots.length === 0}
        emptyTitle="Sin bloques esta semana"
        emptyDescription="Administración o tu entrenador manager planifica tu disponibilidad. Aquí solo la consultas."
        emptyAction={
          <Link to="/schedules" className={buttonClassName('default', 'sm')}>
            Ver horario
          </Link>
        }
        onRetry={() => void query.refetch()}
      >
        <componentComponents.rows>
          {slots.map((slot) => (
            <componentComponents.row
              key={slot.id}
              time={slot.startTime.slice(0, 5)}
              title={slot.dayName}
              meta={`Hasta las ${slot.endTime.slice(0, 5)}`}
              end={
                <componentComponents.status tone={scheduleTone[slot.status]}>
                  {scheduleStatusLabels[slot.status]}
                </componentComponents.status>
              }
            />
          ))}
        </componentComponents.rows>
        {pageNote(slots.length > 0, `${slots.length} ${slots.length === 1 ? 'bloque' : 'bloques'} en la semana.`)}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}

interface PlanPanelProps {
  query: UseQueryResult<MembershipResponse | null>
  clientId: number | null
}

export const planPanel = ({ query, clientId }: PlanPanelProps) => {
  const membership = query.data

  return (
    <componentComponents.panel>
      <componentComponents.panelHead
        icon={luCreditCard}
        title="Mi plan"
        action={clientId === null ? undefined : panelAction(`/clients/${clientId}`, 'Mi ficha')}
      />
      <localComponents.panelState
        isPending={query.isPending}
        isError={query.isError}
        isEmpty={!membership}
        emptyTitle="Sin plan activo"
        emptyDescription="Acércate a recepción para activar o renovar tu membresía."
        onRetry={() => void query.refetch()}
      >
        {membership ? <localComponents.membershipSummary membership={membership} /> : null}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}

const membershipSummary = ({ membership }: { membership: MembershipResponse }) => {
  const reading = readMembership(membership)

  return (
    <div className="dashboardFeature__plan">
      <div className="dashboardFeature__planTop">
        <span className="text-[15px] font-medium">{membershipTypeLabels[membership.type]}</span>
        <componentComponents.status tone={reading.tone}>
          {membershipStatusLabels[membership.status]}
        </componentComponents.status>
      </div>
      <p className="mt-1 text-[12.5px] text-muted">
        {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
      </p>
      <div
        className="dashboardFeature__progress"
        role="progressbar"
        aria-label="Vigencia del plan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={reading.progress.percentageRemaining}
      >
        <div
          className="dashboardFeature__progressFill"
          style={{ width: `${reading.progress.percentageRemaining}%` }}
        />
      </div>
      <p className="mt-2 text-[12.5px] text-muted">{reading.label}</p>
    </div>
  )
}

const localComponents = { panelState, panelEmpty, membershipSummary }

const assignmentTone = {
  ACTIVE: 'ok',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
} as const
interface MyRoutinesPanelProps {
  query: UseQueryResult<RoutineAssignmentsPage>
}

export const myRoutinesPanel = ({ query }: MyRoutinesPanelProps) => {
  const data = query.data

  return (
    <componentComponents.panel>
      <componentComponents.panelHead
        icon={luDumbbell}
        title="Mis rutinas"
        action={panelAction('/routines', 'Ver todas')}
      />
      <localComponents.panelState
        isPending={query.isPending}
        isError={query.isError}
        isEmpty={(data?.content.length ?? 0) === 0}
        emptyTitle="Aún no tienes rutinas"
        emptyDescription="Tu entrenador asignará rutinas a tu perfil cuando corresponda."
        onRetry={() => void query.refetch()}
      >
        <componentComponents.rows>
          {data?.content.map((assignment) => (
            <componentComponents.row
              key={assignment.id}
              title={
                <Link to={`/routines/${assignment.routineId}`}>
                  {assignment.routineName ?? 'Rutina'}
                </Link>
              }
              meta={`Asignada el ${formatDate(assignment.assignmentDate)}`}
              end={
                <componentComponents.status tone={assignmentTone[assignment.status]}>
                  {routineAssignmentStatusLabels[assignment.status]}
                </componentComponents.status>
              }
            />
          ))}
        </componentComponents.rows>
        {pageNote(
          Boolean(data && data.totalElements > data.content.length),
          `Mostrando ${data?.content.length ?? 0} de ${data?.totalElements ?? 0} asignaciones.`,
        )}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}

interface MyPaymentsPanelProps {
  query: UseQueryResult<PaymentsPageResponse>
}

export const myPaymentsPanel = ({ query }: MyPaymentsPanelProps) => {
  const data = query.data

  return (
    <componentComponents.panel>
      <componentComponents.panelHead icon={luReceipt} title="Últimos pagos" />
      <localComponents.panelState
        isPending={query.isPending}
        isError={query.isError}
        isEmpty={(data?.content.length ?? 0) === 0}
        emptyTitle="Sin pagos registrados"
        emptyDescription="Los pagos de tus membresías aparecerán aquí."
        onRetry={() => void query.refetch()}
      >
        <componentComponents.rows>
          {data?.content.map((payment) => (
            <componentComponents.row
              key={payment.id}
              title={formatMoney(payment.amount)}
              meta={`${paymentMethodLabels[payment.method]} · ${formatDate(payment.paymentDate.slice(0, 10))}`}
              end={payment.reference ?? '—'}
            />
          ))}
        </componentComponents.rows>
        {pageNote(
          Boolean(data && data.totalElements > data.content.length),
          `Mostrando los últimos ${data?.content.length ?? 0} de ${data?.totalElements ?? 0} pagos.`,
        )}
      </localComponents.panelState>
    </componentComponents.panel>
  )
}
