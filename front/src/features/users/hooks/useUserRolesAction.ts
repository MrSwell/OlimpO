import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { updateUserRoles } from '../api/userApi'
import type { StaffRole, UserResponse } from '../model/userTypes'

interface UseUserRolesActionProps {
  onSaved: () => void
}

export const useUserRolesAction = ({ onSaved }: UseUserRolesActionProps) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ userId, roles }: { userId: number; roles: StaffRole[] }) =>
      updateUserRoles(userId, roles),
    onSuccess: async (user: UserResponse) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Roles actualizados', `Los permisos de ${user.firstName} cambiaron.`)
      onSaved()
    },
    onError: (error) => {
      toast.error(
        'No se pudieron actualizar los roles',
        error instanceof ApiError
          ? error.message
          : 'Comprueba tu conexión e inténtalo de nuevo.',
      )
    },
  })

  return {
    save: (userId: number, roles: StaffRole[]) => mutation.mutate({ userId, roles }),
    isSaving: mutation.isPending,
  }
}
