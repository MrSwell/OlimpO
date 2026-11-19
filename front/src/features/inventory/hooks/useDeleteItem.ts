import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { deleteInventoryItem } from '../api/inventoryApi'

interface DeleteItemVariables {
  id: number
  name: string
}

/**
 * Deletes an inventory item and returns to the directory. The backend removes
 * the item's movement history together with the item.
 */
export const useDeleteItem = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (item: DeleteItemVariables) => deleteInventoryItem(item.id),
    onSuccess: async (_data, item) => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Ítem eliminado', item.name)
      navigate('/inventory', { replace: true, viewTransition: true })
    },
    onError: (error) => {
      toast.error(
        'No se pudo eliminar el ítem',
        error instanceof ApiError
          ? error.message
          : 'Comprueba tu conexión e inténtalo de nuevo.',
      )
    },
  })
}
