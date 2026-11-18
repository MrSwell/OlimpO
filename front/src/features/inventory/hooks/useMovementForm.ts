import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { parseBackendFieldErrors } from '@/features/clients/model/validationErrors'
import { registerInventoryMovement } from '../api/inventoryApi'
import { movementFormSchema, type MovementFormValues } from '../model/inventoryForm'

const movementDefaultValues: MovementFormValues = {
  type: 'INBOUND',
  quantity: '1',
  observation: '',
}

const movementFields = ['type', 'quantity', 'observation'] as const

interface UseMovementFormProps {
  itemId: number
  isDialogOpen: boolean
  onRegistered: () => void
}

/** Owns the register-movement form: reset per open, submit, and error mapping. */
export const useMovementForm = ({ itemId, isDialogOpen, onRegistered }: UseMovementFormProps) => {
  const queryClient = useQueryClient()
  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: movementDefaultValues,
  })

  useEffect(() => {
    if (isDialogOpen) form.reset(movementDefaultValues)
  }, [isDialogOpen, form])

  const mutation = useMutation({
    mutationFn: (values: MovementFormValues) =>
      registerInventoryMovement(itemId, {
        type: values.type,
        quantity: Number(values.quantity),
        observation: values.observation || null,
      }),
    onSuccess: async (movement) => {
      await queryClient.invalidateQueries({ queryKey: ['inventory', itemId] })
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(
        movement.type === 'INBOUND' ? 'Entrada registrada' : 'Salida registrada',
        'El stock del ítem y el historial de movimientos se actualizaron.',
      )
      onRegistered()
    },
    onError: (error) => {
      const parsed = parseBackendFieldErrors(error, movementFields)

      for (const field of movementFields) {
        const message = parsed.fieldErrors[field]
        if (message) form.setError(field, { type: 'server', message })
      }

      if (parsed.hasUnmappedErrors || Object.keys(parsed.fieldErrors).length === 0) {
        const description =
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.'
        toast.error('No se pudo registrar el movimiento', description)
      }
    },
  })

  const submit = form.handleSubmit((values) => {
    mutation.mutate(values)
  })

  return {
    form,
    submit,
    isSubmitting: mutation.isPending,
  }
}
