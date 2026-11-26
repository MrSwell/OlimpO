import { apiRequest } from '@/lib/apiClient'
import {
  userSchema,
  usersPageSchema,
  type StaffRole,
  type UserResponse,
  type UsersPage,
} from '../model/userTypes'

export interface UserListOptions {
  page: number
  size: number
  search: string
}

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string | null
  roles: StaffRole[]
}

export const getUsers = async (options: UserListOptions): Promise<UsersPage> => {
  const params = new URLSearchParams({
    page: String(options.page),
    size: String(options.size),
  })

  if (options.search) params.set('search', options.search)
  const response = await apiRequest<unknown>(`/users?${params}`)
  return usersPageSchema.parse(response)
}

export const createUser = async (payload: CreateUserPayload): Promise<UserResponse> => {
  const response = await apiRequest<unknown>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return userSchema.parse(response)
}

export const updateUserRoles = async (
  userId: number,
  roles: StaffRole[],
): Promise<UserResponse> => {
  const response = await apiRequest<unknown>(`/users/${userId}/roles`, {
    method: 'PATCH',
    body: JSON.stringify({ roles }),
  })
  return userSchema.parse(response)
}
