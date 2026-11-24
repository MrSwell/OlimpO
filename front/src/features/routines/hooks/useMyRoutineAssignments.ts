import { useQuery } from '@tanstack/react-query'
import { getClientRoutines } from '../api/routineApi'
import { getClientLookup } from '@/features/clients/api/clientApi'

export const useMyRoutineAssignments = (enabled: boolean, page: number, pageSize: number) => {
  const clientQuery = useQuery({
    queryKey: ['client-lookup', 'me'],
    queryFn: () => getClientLookup({ page: 0, size: 1, search: '' }),
    enabled,
  })

  const clientId = clientQuery.data?.content[0]?.id
  const assignmentsQuery = useQuery({
    queryKey: ['client-routines', clientId, page, pageSize],
    queryFn: () => {
      if (clientId === undefined) throw new Error('No se encontró el perfil de cliente.')
      return getClientRoutines(clientId, page, pageSize)
    },
    enabled: enabled && clientId !== undefined,
  })

  return { clientQuery, assignmentsQuery }
}
