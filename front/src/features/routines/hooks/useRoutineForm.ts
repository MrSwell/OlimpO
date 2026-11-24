import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ApiError } from '@/lib/apiClient'
import { parseBackendFieldErrors } from '@/features/clients/model/validationErrors'
import { toast } from '@/stores/toastStore'
import { createRoutine } from '../api/routineApi'
import {
  routineFormDefaultValues,
  routineFormSchema,
  type RoutineFormValues,
} from '../model/routineForm'

const routineFields = ['name', 'type', 'description', 'price', 'trainerId'] as const

interface UseRoutineFormProps {
  open: boolean
  isSupervisor: boolean
  onSaved: () => void
}

export const useRoutineForm = ({ open, isSupervisor, onSaved }: UseRoutineFormProps) => {
  const queryClient = useQueryClient()
  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: routineFormDefaultValues,
  })

  useEffect(() => {
    if (open) form.reset(routineFormDefaultValues)
  }, [form, open])

  const mutation = useMutation({
    mutationFn: (values: RoutineFormValues) =>
      createRoutine({
        name: values.name.trim(),
        type: values.type,
        description: values.description.trim() || null,
        price: values.type === 'CUSTOM' ? Number(values.price) : null,
        trainerId:
          values.type === 'CUSTOM' && isSupervisor && values.trainerId
            ? Number(values.trainerId)
            : null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['routines'] })
      toast.success('Rutina creada', 'Ya aparece en el catálogo.')
      form.reset(routineFormDefaultValues)
      onSaved()
    },
    onError: (error) => {
      const parsed = parseBackendFieldErrors(error, routineFields)
      for (const field of routineFields) {
        const message = parsed.fieldErrors[field]
        if (message) form.setError(field, { type: 'server', message })
      }

      if (parsed.hasUnmappedErrors || Object.keys(parsed.fieldErrors).length === 0) {
        toast.error(
          'No se pudo crear la rutina',
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.',
        )
      }
    },
  })

  return {
    form,
    submit: form.handleSubmit((values) => {
      if (isSupervisor && values.type === 'CUSTOM' && !values.trainerId) {
        form.setError('trainerId', {
          type: 'manual',
          message: 'Selecciona el entrenador responsable.',
        })
        return
      }
      mutation.mutate(values)
    }),
    isSubmitting: mutation.isPending,
  }
}
