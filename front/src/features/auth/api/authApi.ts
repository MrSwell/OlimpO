import { apiRequest } from '@/lib/apiClient'
import {
  authenticatedUserResponseSchema,
  loginResponseSchema,
  type AuthenticatedUserResponse,
  type LoginResponse,
} from '../model/authTypes'

export interface LoginCredentials {
  email: string
  password: string
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await apiRequest<unknown>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    },
    false,
    false,
  )

  return loginResponseSchema.parse(response)
}

export const getCurrentUser = async (): Promise<AuthenticatedUserResponse> => {
  const response = await apiRequest<unknown>('/auth/me')
  return authenticatedUserResponseSchema.parse(response)
}
