import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { assignRoutine } from '../api/routineApi'
import type { RoutineAssignmentStatus } from '../model/routineTypes'

export const useRoutineAssignment = (routineId: number, onAssigned: () => void) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (values: { clientId: number; status: RoutineAssignmentStatus }) =>
      assignRoutine(routineId, values.clientId, values.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['routine-assignments', routineId] })
      toast.success('Rutina asignada', 'La asignación quedó registrada.')
      onAssigned()
    },
    onError: (error) => {
      toast.error(
        'No se pudo asignar la rutina',
        error instanceof ApiError
          ? error.message
          : 'Comprueba tu conexión e inténtalo de nuevo.',
      )
    },
  })

  return mutation
}
