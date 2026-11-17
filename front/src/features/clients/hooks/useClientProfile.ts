import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getActiveMembership,
  getClient,
  getClientMemberships,
  getClientPayments,
} from '../api/clientApi'

const historyPageSize = 5

export const useClientProfile = (rawClientId: string | undefined) => {
  const clientId = Number(rawClientId)
  const hasValidClientId = Number.isSafeInteger(clientId) && clientId > 0
  const [membershipPage, setMembershipPage] = useState(0)
  const [paymentPage, setPaymentPage] = useState(0)

  const clientQuery = useQuery({
    queryKey: ['client', clientId, 'profile'],
    queryFn: () => getClient(clientId),
    enabled: hasValidClientId,
  })

  const enabled = hasValidClientId && clientQuery.isSuccess

  const activeMembershipQuery = useQuery({
    queryKey: ['client', clientId, 'active-membership'],
    queryFn: () => getActiveMembership(clientId),
    enabled,
  })

  const membershipsQuery = useQuery({
    queryKey: ['client', clientId, 'memberships', membershipPage, historyPageSize],
    queryFn: () => getClientMemberships(clientId, membershipPage, historyPageSize),
    enabled,
  })

  const paymentsQuery = useQuery({
    queryKey: ['client', clientId, 'payments', paymentPage, historyPageSize],
    queryFn: () => getClientPayments(clientId, paymentPage, historyPageSize),
    enabled,
  })

  return {
    clientId,
    hasValidClientId,
    clientQuery,
    activeMembershipQuery,
    membershipsQuery,
    paymentsQuery,
    membershipPage,
    setMembershipPage,
    paymentPage,
    setPaymentPage,
    historyPageSize,
  }
}
