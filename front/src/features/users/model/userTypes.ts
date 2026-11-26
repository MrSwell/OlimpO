import { z } from 'zod'
import { userRoleSchema } from '@/features/auth/model/authTypes'

export const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

/** Roles that can be assigned through user management; CLIENT is created from /clients. */
export const staffRoleSchema = z.enum([
  'ADMIN',
  'RECEPCIONIST',
  'TRAINER_MANAGER',
  'TRAINER',
])

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  status: userStatusSchema,
  roles: z.array(userRoleSchema),
  createdAt: z.string(),
})

export const usersPageSchema = z.object({
  content: z.array(userSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export const userFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo es obligatorio.')
    .email('Ingresa un correo válido.')
    .max(255, 'El correo no puede superar 255 caracteres.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(72, 'La contraseña no puede superar 72 caracteres.'),
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'El apellido es obligatorio.')
    .max(100, 'El apellido no puede superar 100 caracteres.'),
  phone: z.string().trim().max(20, 'El celular no puede superar 20 caracteres.'),
  roles: z.array(staffRoleSchema).min(1, 'Selecciona al menos un rol.'),
})

export type UserStatus = z.infer<typeof userStatusSchema>
export type StaffRole = z.infer<typeof staffRoleSchema>
export type UserResponse = z.infer<typeof userSchema>
export type UsersPage = z.infer<typeof usersPageSchema>
export type UserFormValues = z.infer<typeof userFormSchema>

export const staffRoles = ['ADMIN', 'RECEPCIONIST', 'TRAINER_MANAGER', 'TRAINER'] as const

export const staffRoleLabels: Record<StaffRole, string> = {
  ADMIN: 'Administrador',
  RECEPCIONIST: 'Recepcionista',
  TRAINER_MANAGER: 'Entrenador manager',
  TRAINER: 'Entrenador',
}

export const staffRoleHints: Record<StaffRole, string> = {
  ADMIN: 'Control total del sistema y de las cuentas.',
  RECEPCIONIST: 'Clientes, membresías y pagos.',
  TRAINER_MANAGER: 'Horarios del equipo y rutinas.',
  TRAINER: 'Su propia malla y rutinas asignadas.',
}

export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}

export const userFormDefaultValues: UserFormValues = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  roles: ['RECEPCIONIST'],
}
