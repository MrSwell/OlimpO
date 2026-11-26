import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ApiError } from '@/lib/apiClient'
import { parseBackendFieldErrors } from '@/features/clients/model/validationErrors'
import { toast } from '@/stores/toastStore'
import { createUser } from '../api/userApi'
import {
  userFormDefaultValues,
  userFormSchema,
  type UserFormValues,
} from '../model/userTypes'

const userFields = ['email', 'password', 'firstName', 'lastName', 'phone', 'roles'] as const

interface UseUserFormProps {
  open: boolean
  onSaved: () => void
}

export const useUserForm = ({ open, onSaved }: UseUserFormProps) => {
  const queryClient = useQueryClient()
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: userFormDefaultValues,
  })

  useEffect(() => {
    if (open) form.reset(userFormDefaultValues)
  }, [form, open])

  const mutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      createUser({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim() || null,
        roles: values.roles,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario creado', 'Ya puede iniciar sesión con la contraseña asignada.')
      form.reset(userFormDefaultValues)
      onSaved()
    },
    onError: (error) => {
      const parsed = parseBackendFieldErrors(error, userFields)
      for (const field of userFields) {
        const message = parsed.fieldErrors[field]
        if (message) form.setError(field, { type: 'server', message })
      }

      if (parsed.hasUnmappedErrors || Object.keys(parsed.fieldErrors).length === 0) {
        toast.error(
          'No se pudo crear el usuario',
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.',
        )
      }
    },
  })

  return {
    form,
    submit: form.handleSubmit((values) => mutation.mutate(values)),
    isSubmitting: mutation.isPending,
  }
}
