import type { UserRole } from '@/features/auth/model/authTypes'
import type { MembershipResponse } from '@/features/clients/model/clientTypes'
import { getMembershipProgress } from '@/features/clients/model/clientFormatting'
import { scheduleDays } from '@/features/schedules/model/scheduleTypes'
import type { ScheduleSlot } from '@/features/schedules/model/scheduleTypes'

export type DashboardView = 'admin' | 'reception' | 'manager' | 'trainer' | 'client'

export interface DashboardRoleFlags {
  view: DashboardView
  canManageClients: boolean
  canManageTraining: boolean
  seesRoutineCatalog: boolean
}

/**
 * One dashboard per person, chosen by the most specific role. The order mirrors
 * `getRoleLabel`, so a manager who is also a trainer keeps the manager view.
 */
export const getDashboardRoleFlags = (roles: readonly UserRole[]): DashboardRoleFlags => {
  if (roles.includes('ADMIN')) {
    return {
      view: 'admin',
      canManageClients: true,
      canManageTraining: true,
      seesRoutineCatalog: true,
    }
  }

  if (roles.includes('RECEPCIONIST')) {
    return {
      view: 'reception',
      canManageClients: true,
      canManageTraining: false,
      seesRoutineCatalog: true,
    }
  }

  if (roles.includes('TRAINER_MANAGER')) {
    return {
      view: 'manager',
      canManageClients: false,
      canManageTraining: true,
      seesRoutineCatalog: true,
    }
  }

  if (roles.includes('TRAINER')) {
    return {
      view: 'trainer',
      canManageClients: false,
      canManageTraining: true,
      seesRoutineCatalog: true,
    }
  }

  return {
    view: 'client',
    canManageClients: false,
    canManageTraining: false,
    seesRoutineCatalog: false,
  }
}

export const dashboardLedes: Record<DashboardView, string> = {
  admin: 'Clientes, inventario y máquinas del gimnasio en una sola lectura.',
  reception: 'Atención al cliente y catálogo de rutinas, sin salir del panel.',
  manager: 'Horarios, equipo e inventario para coordinar la operación diaria.',
  trainer: 'Tu semana, el inventario crítico y el estado de las máquinas.',
  client: 'Tu plan, tus rutinas y los pagos más recientes.',
}

const todayFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export const formatDashboardToday = (date = new Date()): string => {
  const label = todayFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const dayOrder = new Map<number, number>(
  scheduleDays.map((day, index) => [day.value, index] as const),
)

/** Monday first, then by start time, matching the weekly ledger. */
export const sortScheduleSlots = (slots: readonly ScheduleSlot[]): ScheduleSlot[] =>
  [...slots].sort((left, right) => {
    const leftDay = dayOrder.get(left.dayOfWeek) ?? 0
    const rightDay = dayOrder.get(right.dayOfWeek) ?? 0
    return leftDay - rightDay || left.startTime.localeCompare(right.startTime)
  })

export interface MembershipReading {
  progress: ReturnType<typeof getMembershipProgress>
  label: string
  tone: 'ok' | 'warn' | 'danger' | 'neutral'
}

export const readMembership = (membership: MembershipResponse): MembershipReading => {
  const progress = getMembershipProgress(membership.startDate, membership.endDate)

  if (membership.status === 'CANCELLED') {
    return { progress, label: 'Membresía cancelada', tone: 'neutral' }
  }

  if (progress.state === 'expired' || membership.status === 'EXPIRED') {
    const days = Math.max(1, progress.daysOverdue)
    return {
      progress,
      label: `Venció hace ${days} ${days === 1 ? 'día' : 'días'}`,
      tone: 'danger',
    }
  }

  if (progress.state === 'upcoming') {
    const days = Math.max(1, progress.daysUntilStart)
    return {
      progress,
      label: `Comienza en ${days} ${days === 1 ? 'día' : 'días'}`,
      tone: 'warn',
    }
  }

  const days = progress.daysRemaining
  return {
    progress,
    label: `Vence en ${days} ${days === 1 ? 'día' : 'días'}`,
    tone: days <= 5 ? 'warn' : 'ok',
  }
}
