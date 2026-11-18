import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { parseBackendFieldErrors } from '@/features/clients/model/validationErrors'
import { createMachine, updateMachine } from '../api/machineApi'
import type { Machine } from '../model/machineTypes'
import { machineFormSchema, type MachineFormValues } from '../model/machineForm'

const defaultValues: MachineFormValues = {
  name: '',
  brand: '',
  model: '',
  serialNumber: '',
  status: 'AVAILABLE',
}

const machineFields = ['name', 'brand', 'model', 'serialNumber', 'status'] as const

interface UseMachineFormProps {
  machine: Machine | null
  onSaved: (saved: Machine) => void
}

export const useMachineForm = ({ machine, onSaved }: UseMachineFormProps) => {
  const queryClient = useQueryClient()
  const form = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(
      machine
        ? {
            name: machine.name,
            brand: machine.brand ?? '',
            model: machine.model ?? '',
            serialNumber: machine.serialNumber ?? '',
            status: machine.status,
          }
        : defaultValues,
    )
  }, [machine, form])

  const mutation = useMutation({
    mutationFn: (values: MachineFormValues) => {
      const payload = {
        name: values.name,
        brand: values.brand || null,
        model: values.model || null,
        serialNumber: values.serialNumber || null,
        status: values.status,
      }
      return machine ? updateMachine(machine.id, payload) : createMachine(payload)
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['machines'] })
      toast.success(
        machine ? 'Máquina actualizada' : 'Máquina creada',
        machine
          ? 'La máquina se guardó con el estado actualizado.'
          : 'La máquina ya aparece en el directorio.',
      )
      onSaved(saved)
    },
    onError: (error) => {
      const parsed = parseBackendFieldErrors(error, machineFields)

      for (const field of machineFields) {
        const message = parsed.fieldErrors[field]
        if (message) form.setError(field, { type: 'server', message })
      }

      if (parsed.hasUnmappedErrors || Object.keys(parsed.fieldErrors).length === 0) {
        const description =
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.'
        toast.error(
          machine ? 'No se pudo actualizar la máquina' : 'No se pudo crear la máquina',
          description,
        )
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
