import { z } from 'zod'

export const userRoleSchema = z.enum([
  'ADMIN',
  'RECEPCIONIST',
  'TRAINER_MANAGER',
  'TRAINER',
  'CLIENT',
])

export type UserRole = z.infer<typeof userRoleSchema>

export const roleGroups = {
  all: ['ADMIN', 'RECEPCIONIST', 'TRAINER_MANAGER', 'TRAINER', 'CLIENT'],
  clientManagement: ['ADMIN', 'RECEPCIONIST'],
  clientRecord: ['ADMIN', 'RECEPCIONIST', 'CLIENT'],
  trainingStaff: ['ADMIN', 'TRAINER_MANAGER', 'TRAINER'],
} as const satisfies Record<string, readonly UserRole[]>

export const loginResponseSchema = z.object({
  token: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
  email: z.string().email(),
  roles: z.array(userRoleSchema).min(1),
})

export type LoginResponse = z.infer<typeof loginResponseSchema>

export const authenticatedUserResponseSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  roles: z.array(userRoleSchema).min(1),
})

export type AuthenticatedUserResponse = z.infer<typeof authenticatedUserResponseSchema>
