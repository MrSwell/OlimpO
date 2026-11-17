import { apiRequest } from '@/lib/apiClient'
import {
  paymentResponseSchema,
  type PaymentMethod,
  type PaymentResponse,
} from '@/features/clients/model/clientTypes'

export interface CreatePaymentRequest {
  membershipId: number
  amount: number
  method: PaymentMethod
  reference: string | null
}

export const createPayment = async (request: CreatePaymentRequest): Promise<PaymentResponse> => {
  const response = await apiRequest<unknown>('/payments', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return paymentResponseSchema.parse(response)
}
