import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { createMembership, renewMembership } from '../api/clientApi'
import { getRenewalDates } from '../model/clientFormatting'
import {
  membershipFormSchema,
  type MembershipFormValues,
  type MembershipResponse,
} from '../model/clientTypes'
import { parseBackendFieldErrors } from '../model/validationErrors'

interface UseMembershipActionOptions {
  open: boolean
  clientId: number
  membership: MembershipResponse | null
  onSaved: () => void
}

const defaultValues: MembershipFormValues = {
  type: 'MONTHLY',
  price: '',
  method: 'CASH',
  reference: '',
  startDate: '',
}

export const useMembershipAction = ({
  open,
  clientId,
  membership,
  onSaved,
}: UseMembershipActionOptions) => {
  const queryClient = useQueryClient()
  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipFormSchema),
    defaultValues,
  })
  const type = form.watch('type')
  const renewalDates =
    membership && open ? getRenewalDates(membership.endDate, type) : null
  const membershipFields = ['type', 'price', 'method', 'reference'] as const

  useEffect(() => {
    if (open) form.reset(defaultValues)
  }, [form, open, membership])

  const submit = form.handleSubmit(async (values) => {
    try {
      if (membership) {
        await renewMembership(membership.id, {
          type: values.type,
          price: Number(values.price),
          method: values.method,
          reference: values.reference || null,
        })
      } else {
        await createMembership({
          clientId,
          type: values.type,
          price: Number(values.price),
          method: values.method,
          reference: values.reference || null,
          startDate: values.startDate || null,
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['client', clientId] })
      await queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success(membership ? 'Membresía renovada' : 'Membresía activada')
      onSaved()
    } catch (error) {
      const parsed = parseBackendFieldErrors(error, membershipFields)

      for (const field of membershipFields) {
        const message = parsed.fieldErrors[field]
        if (message) form.setError(field, { type: 'server', message })
      }

      const firstField = membershipFields.find((field) => parsed.fieldErrors[field])
      if (firstField) form.setFocus(firstField)

      if (parsed.hasUnmappedErrors || Object.keys(parsed.fieldErrors).length === 0) {
        const description =
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.'
        toast.error(
          membership ? 'No se pudo renovar la membresía' : 'No se pudo activar la membresía',
          description,
        )
      }
    }
  })

  return { form, submit, renewalDates, isSubmitting: form.formState.isSubmitting }
}
