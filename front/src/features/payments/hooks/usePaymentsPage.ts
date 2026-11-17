import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import {
  getClient,
  getClientMemberships,
  getClientPayments,
  getClients,
} from '@/features/clients/api/clientApi'
import type { ClientResponse } from '@/features/clients/model/clientTypes'
import { parseBackendFieldErrors } from '@/features/clients/model/validationErrors'
import { createPayment, type CreatePaymentRequest } from '../api/paymentApi'
import { paymentFormSchema, type PaymentFormValues } from '../model/paymentForm'

const clientSearchPageSize = 6
const membershipPageSize = 20
const paymentPageSize = 5

interface RecordPaymentVariables extends CreatePaymentRequest {
  clientId: number
  defaultAmount: string
}

const defaultValues: PaymentFormValues = {
  membershipId: '',
  amount: '',
  method: 'CASH',
  reference: '',
}

const readClientId = (value: string | null): number | null => {
  const id = Number(value)
  return value && Number.isSafeInteger(id) && id > 0 ? id : null
}

export const usePaymentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClientId = readClientId(searchParams.get('clientId'))
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [membershipPageState, setMembershipPageState] = useState({
    clientId: selectedClientId,
    page: 0,
  })
  const [paymentPageState, setPaymentPageState] = useState({
    clientId: selectedClientId,
    page: 0,
  })
  const queryClient = useQueryClient()
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues,
  })
  const membershipPage =
    membershipPageState.clientId === selectedClientId ? membershipPageState.page : 0
  const paymentPage =
    paymentPageState.clientId === selectedClientId ? paymentPageState.page : 0
  const setMembershipPage = (page: number) =>
    setMembershipPageState({ clientId: selectedClientId, page })
  const setPaymentPage = (page: number) =>
    setPaymentPageState({ clientId: selectedClientId, page })

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timeoutId)
  }, [search])

  useEffect(() => {
    form.reset(defaultValues)
  }, [selectedClientId, form])

  const clientSearchQuery = useQuery({
    queryKey: ['clients', 'payment-search', debouncedSearch, clientSearchPageSize],
    queryFn: () => getClients({ page: 0, size: clientSearchPageSize, search: debouncedSearch }),
    enabled: debouncedSearch.length >= 2 && selectedClientId === null,
  })

  const clientQuery = useQuery({
    queryKey: ['client', selectedClientId, 'profile'],
    queryFn: () => {
      if (selectedClientId === null) throw new Error('Selecciona un cliente para continuar.')
      return getClient(selectedClientId)
    },
    enabled: selectedClientId !== null,
  })

  const canLoadClientData = selectedClientId !== null && clientQuery.isSuccess

  const membershipsQuery = useQuery({
    queryKey: ['client', selectedClientId, 'memberships', membershipPage, membershipPageSize],
    queryFn: () => {
      if (selectedClientId === null) throw new Error('Selecciona un cliente para continuar.')
      return getClientMemberships(selectedClientId, membershipPage, membershipPageSize)
    },
    enabled: canLoadClientData,
  })

  const paymentsQuery = useQuery({
    queryKey: ['client', selectedClientId, 'payments', paymentPage, paymentPageSize],
    queryFn: () => {
      if (selectedClientId === null) throw new Error('Selecciona un cliente para continuar.')
      return getClientPayments(selectedClientId, paymentPage, paymentPageSize)
    },
    enabled: canLoadClientData,
  })

  useEffect(() => {
    const memberships = membershipsQuery.data?.content
    if (!memberships) return

    const currentMembershipId = form.getValues('membershipId')
    const currentMembership = memberships.find(
      (membership) => String(membership.id) === currentMembershipId,
    )

    if (currentMembership) {
      if (!form.getValues('amount')) {
        form.setValue('amount', String(currentMembership.price))
      }
      return
    }

    const preferredMembership =
      memberships.find((membership) => membership.status === 'ACTIVE') ?? memberships[0]

    if (!preferredMembership) {
      form.setValue('membershipId', '')
      form.setValue('amount', '')
      return
    }

    form.setValue('membershipId', String(preferredMembership.id))
    form.setValue('amount', String(preferredMembership.price))
  }, [form, membershipsQuery.data])

  const mutation = useMutation({
    mutationFn: ({ clientId: _clientId, defaultAmount: _defaultAmount, ...request }:
      RecordPaymentVariables) => createPayment(request),
    onSuccess: async (_payment, request) => {
      await queryClient.invalidateQueries({
        queryKey: ['client', request.clientId, 'payments'],
      })
      form.reset({
        ...defaultValues,
        membershipId: String(request.membershipId),
        amount: request.defaultAmount,
      })
      toast.success('Pago registrado', 'El historial y el acumulado de esta página se actualizaron.')
    },
    onError: (error) => {
      const paymentFields = ['membershipId', 'amount', 'method', 'reference'] as const
      const parsed = parseBackendFieldErrors(error, paymentFields)

      for (const field of paymentFields) {
        const message = parsed.fieldErrors[field]
        if (message) form.setError(field, { type: 'server', message })
      }

      const firstField = paymentFields.find((field) => parsed.fieldErrors[field])
      if (firstField) form.setFocus(firstField)

      if (parsed.hasUnmappedErrors || Object.keys(parsed.fieldErrors).length === 0) {
        const description =
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.'
        toast.error('No se pudo registrar el pago', description)
      }
    },
  })

  const selectClient = (client: ClientResponse) => {
    queryClient.setQueryData(['client', client.id, 'profile'], client)
    setMembershipPage(0)
    setPaymentPage(0)
    form.reset(defaultValues)
    setSearch('')
    setDebouncedSearch('')

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('clientId', String(client.id))
    setSearchParams(nextParams, { replace: true })
  }

  const clearClient = () => {
    setMembershipPage(0)
    setPaymentPage(0)
    form.reset(defaultValues)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('clientId')
    setSearchParams(nextParams, { replace: true })
  }

  const submit = form.handleSubmit((values) => {
    if (selectedClientId === null) {
      toast.error('Selecciona un cliente', 'Busca y elige un cliente antes de registrar el pago.')
      return
    }

    const membershipId = Number(values.membershipId)
    if (!Number.isSafeInteger(membershipId) || membershipId < 1) {
      form.setError('membershipId', { type: 'validate', message: 'Selecciona una membresía.' })
      form.setFocus('membershipId')
      return
    }

    const request: RecordPaymentVariables = {
      clientId: selectedClientId,
      defaultAmount: String(
        membershipsQuery.data?.content.find((membership) => membership.id === membershipId)?.price ??
          '',
      ),
      membershipId,
      amount: Number(values.amount),
      method: values.method,
      reference: values.reference || null,
    }
    mutation.mutate(request)
  })

  return {
    search,
    setSearch,
    debouncedSearch,
    clientSearchQuery,
    selectClient,
    clearClient,
    selectedClientId,
    clientQuery,
    membershipsQuery,
    membershipPage,
    membershipPageSize,
    setMembershipPage,
    paymentsQuery,
    paymentPage,
    paymentPageSize,
    setPaymentPage,
    form,
    submit,
    isSubmitting: mutation.isPending,
  }
}
