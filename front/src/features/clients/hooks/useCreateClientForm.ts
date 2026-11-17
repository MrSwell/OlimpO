import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { queryClient } from '@/lib/queryClient'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { createClient, createMembership } from '../api/clientApi'
import {
  clientFormSchema,
  type ClientFormValues,
  type CreateClientRequest,
  type CreateMembershipRequest,
} from '../model/clientTypes'
import { parseBackendFieldErrors } from '../model/validationErrors'

const defaultValues: ClientFormValues = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  documentNumber: '',
  birthDate: '',
  sex: '',
  fitnessGoal: '',
  addMembership: false,
  membershipType: 'MONTHLY',
  membershipPrice: '',
  paymentMethod: 'CASH',
  reference: '',
  startDate: '',
}

export const useCreateClientForm = () => {
  const navigate = useNavigate()
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  })
  const clientFields = [
    'email',
    'password',
    'firstName',
    'lastName',
    'phone',
    'documentNumber',
    'birthDate',
    'sex',
    'fitnessGoal',
  ] as const

  const submit = form.handleSubmit(async (values) => {
    const clientRequest: CreateClientRequest = {
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      documentNumber: values.documentNumber,
      birthDate: values.birthDate || null,
      sex: values.sex || null,
      fitnessGoal: values.fitnessGoal || null,
    }

    try {
      const client = await createClient(clientRequest)
      await queryClient.invalidateQueries({ queryKey: ['clients'] })

      if (values.addMembership) {
        const membershipRequest: CreateMembershipRequest = {
          clientId: client.id,
          type: values.membershipType,
          price: Number(values.membershipPrice),
          method: values.paymentMethod,
          reference: values.reference || null,
          startDate: values.startDate || null,
        }

        try {
          await createMembership(membershipRequest)
        } catch (error) {
          toast.error(
            'Cliente creado; membresía pendiente',
            error instanceof ApiError
              ? error.message
              : 'No se pudo activar la membresía. Puedes intentarlo desde la ficha del cliente.',
          )
          navigate(`/clients/${client.id}`, { replace: true })
          return
        }
      }

      toast.success(
        'Cliente creado',
        values.addMembership ? 'La membresía inicial también quedó registrada.' : undefined,
      )
      navigate(`/clients/${client.id}`, { replace: true })
    } catch (error) {
      const parsed = parseBackendFieldErrors(error, clientFields)

      for (const field of clientFields) {
        const message = parsed.fieldErrors[field]
        if (message) {
          form.setError(field, { type: 'server', message })
        }
      }

      const firstField = clientFields.find((field) => parsed.fieldErrors[field])
      if (firstField) form.setFocus(firstField)

      if (parsed.hasUnmappedErrors || Object.keys(parsed.fieldErrors).length === 0) {
        const description =
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.'
        toast.error('No se pudo crear el cliente', description)
      }
    }
  })

  return { form, submit }
}
