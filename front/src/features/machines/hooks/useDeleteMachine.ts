import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { deleteMachine } from '../api/machineApi'

interface DeleteMachineVariables {
  id: number
  name: string
}

/** Deletes a machine from the directory and refreshes the current page. */
export const useDeleteMachine = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (machine: DeleteMachineVariables) => deleteMachine(machine.id),
    onSuccess: async (_data, machine) => {
      await queryClient.invalidateQueries({ queryKey: ['machines'] })
      toast.success('Máquina eliminada', machine.name)
    },
    onError: (error) => {
      toast.error(
        'No se pudo eliminar la máquina',
        error instanceof ApiError
          ? error.message
          : 'Comprueba tu conexión e inténtalo de nuevo.',
      )
    },
  })
}
