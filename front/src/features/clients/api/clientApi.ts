import { ApiError, apiRequest } from '@/lib/apiClient'
import {
  clientResponseSchema,
  clientLookupPageSchema,
  clientsPageResponseSchema,
  membershipResponseSchema,
  membershipsPageResponseSchema,
  paymentsPageResponseSchema,
  type ClientResponse,
  type ClientLookupPage,
  type ClientsPageResponse,
  type CreateClientRequest,
  type CreateMembershipRequest,
  type MembershipResponse,
  type MembershipsPageResponse,
  type PaymentsPageResponse,
  type RenewMembershipRequest,
} from '../model/clientTypes'

interface ClientListOptions {
  page: number
  size: number
  search: string
}

const createQuery = (options: ClientListOptions): string => {
  const params = new URLSearchParams({
    page: String(options.page),
    size: String(options.size),
  })

  if (options.search) params.set('search', options.search)
  return params.toString()
}

export const getClients = async (options: ClientListOptions): Promise<ClientsPageResponse> => {
  const response = await apiRequest<unknown>(`/clients?${createQuery(options)}`)
  return clientsPageResponseSchema.parse(response)
}

export const getClientLookup = async (options: ClientListOptions): Promise<ClientLookupPage> => {
  const response = await apiRequest<unknown>(`/clients/lookup?${createQuery(options)}`)
  return clientLookupPageSchema.parse(response)
}

export const createClient = async (request: CreateClientRequest): Promise<ClientResponse> => {
  const response = await apiRequest<unknown>('/clients', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return clientResponseSchema.parse(response)
}

export const getClient = async (clientId: number): Promise<ClientResponse> => {
  const response = await apiRequest<unknown>(`/clients/${clientId}`)
  return clientResponseSchema.parse(response)
}

export const getClientMemberships = async (
  clientId: number,
  page: number,
  size: number,
): Promise<MembershipsPageResponse> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const response = await apiRequest<unknown>(`/clients/${clientId}/memberships?${params}`)
  return membershipsPageResponseSchema.parse(response)
}

export const getClientPayments = async (
  clientId: number,
  page: number,
  size: number,
): Promise<PaymentsPageResponse> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const response = await apiRequest<unknown>(`/clients/${clientId}/payments?${params}`)
  return paymentsPageResponseSchema.parse(response)
}

export const getActiveMembership = async (clientId: number): Promise<MembershipResponse | null> => {
  const params = new URLSearchParams({ clientId: String(clientId) })

  try {
    const response = await apiRequest<unknown>(`/memberships/active?${params}`)
    return membershipResponseSchema.parse(response)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export const createMembership = async (
  request: CreateMembershipRequest,
): Promise<MembershipResponse> => {
  const response = await apiRequest<unknown>('/memberships', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return membershipResponseSchema.parse(response)
}

export const renewMembership = async (
  membershipId: number,
  request: RenewMembershipRequest,
): Promise<MembershipResponse> => {
  const response = await apiRequest<unknown>(`/memberships/${membershipId}/renew`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  })
  return membershipResponseSchema.parse(response)
}
