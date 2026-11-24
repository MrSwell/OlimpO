import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import {
  getActiveMembership,
  getClientLookup,
  getClientPayments,
  getClients,
} from '@/features/clients/api/clientApi'
import { getLowStockItems } from '@/features/inventory/api/inventoryApi'
import { getMachines } from '@/features/machines/api/machineApi'
import { getClientRoutines, getRoutines } from '@/features/routines/api/routineApi'
import { useWeeklySchedule } from '@/features/schedules/hooks/useWeeklySchedule'
import { getTrainers } from '@/features/trainers/api/trainerApi'
import { getDashboardRoleFlags } from '../model/dashboardModel'

const panelSize = 5
const paymentPanelSize = 3

/**
 * Dashboard reads only from endpoints that already exist. Each block is
 * enabled by role, so a trainer never calls client endpoints and a client
 * never calls the staff directories.
 */
export const useDashboardData = () => {
  const roles = useAuthStore((state) => state.roles)
  const flags = getDashboardRoleFlags(roles)
  const isClientView = flags.view === 'client'

  const clientsQuery = useQuery({
    queryKey: ['clients', 'dashboard', panelSize],
    queryFn: () => getClients({ page: 0, size: panelSize, search: '' }),
    enabled: flags.canManageClients,
  })

  const lowStockQuery = useQuery({
    queryKey: ['inventory', 'low-stock', 'dashboard', panelSize],
    queryFn: () => getLowStockItems({ page: 0, size: panelSize, search: '' }),
    enabled: flags.canManageTraining,
  })

  const availableMachinesQuery = useQuery({
    queryKey: ['machines', 'dashboard', 'AVAILABLE'],
    queryFn: () => getMachines({ page: 0, size: 1, search: '', status: 'AVAILABLE' }),
    enabled: flags.canManageTraining,
  })

  const maintenanceMachinesQuery = useQuery({
    queryKey: ['machines', 'dashboard', 'MAINTENANCE'],
    queryFn: () => getMachines({ page: 0, size: 1, search: '', status: 'MAINTENANCE' }),
    enabled: flags.canManageTraining,
  })

  const outOfServiceMachinesQuery = useQuery({
    queryKey: ['machines', 'dashboard', 'OUT_OF_SERVICE'],
    queryFn: () => getMachines({ page: 0, size: 1, search: '', status: 'OUT_OF_SERVICE' }),
    enabled: flags.canManageTraining,
  })

  const routinesQuery = useQuery({
    queryKey: ['routines', 'dashboard', panelSize],
    queryFn: () => getRoutines({ page: 0, size: panelSize, search: '', type: 'ALL' }),
    enabled: flags.seesRoutineCatalog,
  })

  const generalRoutinesQuery = useQuery({
    queryKey: ['routines', 'dashboard', 'GENERAL'],
    queryFn: () => getRoutines({ page: 0, size: 1, search: '', type: 'GENERAL' }),
    enabled: flags.seesRoutineCatalog,
  })

  const customRoutinesQuery = useQuery({
    queryKey: ['routines', 'dashboard', 'CUSTOM'],
    queryFn: () => getRoutines({ page: 0, size: 1, search: '', type: 'CUSTOM' }),
    enabled: flags.seesRoutineCatalog,
  })

  const teamQuery = useQuery({
    queryKey: ['trainers', 'dashboard', panelSize],
    queryFn: () => getTrainers({ page: 0, size: panelSize, search: '' }),
    enabled: flags.view === 'manager',
  })

  const ownTrainerQuery = useQuery({
    queryKey: ['trainers', 'dashboard', 'self'],
    queryFn: () => getTrainers({ page: 0, size: 1, search: '' }),
    enabled: flags.view === 'trainer',
  })

  const ownTrainerId = ownTrainerQuery.data?.content[0]?.id ?? null
  const weekQuery = useWeeklySchedule(flags.view === 'trainer' ? ownTrainerId : null)

  const clientLookupQuery = useQuery({
    queryKey: ['client-lookup', 'me'],
    queryFn: () => getClientLookup({ page: 0, size: 1, search: '' }),
    enabled: isClientView,
  })

  const clientId = clientLookupQuery.data?.content[0]?.id ?? null

  const membershipQuery = useQuery({
    queryKey: ['client', clientId, 'active-membership'],
    queryFn: () => {
      if (clientId === null) throw new Error('No se encontró el perfil de cliente.')
      return getActiveMembership(clientId)
    },
    enabled: isClientView && clientId !== null,
  })

  const clientRoutinesQuery = useQuery({
    queryKey: ['client-routines', clientId, 0, panelSize],
    queryFn: () => {
      if (clientId === null) throw new Error('No se encontró el perfil de cliente.')
      return getClientRoutines(clientId, 0, panelSize)
    },
    enabled: isClientView && clientId !== null,
  })

  const clientPaymentsQuery = useQuery({
    queryKey: ['client', clientId, 'payments', 0, paymentPanelSize],
    queryFn: () => {
      if (clientId === null) throw new Error('No se encontró el perfil de cliente.')
      return getClientPayments(clientId, 0, paymentPanelSize)
    },
    enabled: isClientView && clientId !== null,
  })

  return {
    flags,
    clientId,
    clientsQuery,
    lowStockQuery,
    availableMachinesQuery,
    maintenanceMachinesQuery,
    outOfServiceMachinesQuery,
    routinesQuery,
    generalRoutinesQuery,
    customRoutinesQuery,
    teamQuery,
    weekQuery,
    membershipQuery,
    clientRoutinesQuery,
    clientPaymentsQuery,
  }
}
