import { z } from 'zod'

export const clientResponseSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  documentNumber: z.string(),
  birthDate: z.string().nullable(),
  sex: z.string().nullable(),
  fitnessGoal: z.string().nullable(),
  status: z.string(),
})

export const membershipTypeSchema = z.enum(['DAILY', 'QUARTERLY', 'MONTHLY'])
export const paymentMethodSchema = z.enum(['CASH', 'CARD', 'TRANSFER', 'NEQUI'])

export const membershipResponseSchema = z.object({
  id: z.number().int().positive(),
  clientId: z.number().int().positive(),
  type: membershipTypeSchema,
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']),
  price: z.number(),
  createdAt: z.string(),
})

export const paymentResponseSchema = z.object({
  id: z.number().int().positive(),
  membershipId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  amount: z.number(),
  method: paymentMethodSchema,
  reference: z.string().nullable(),
  paymentDate: z.string(),
})

const pageResponseSchema = <T extends z.ZodType>(contentSchema: T) =>
  z.object({
    content: z.array(contentSchema),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })

export const clientsPageResponseSchema = pageResponseSchema(clientResponseSchema)
export const membershipsPageResponseSchema = pageResponseSchema(membershipResponseSchema)
export const paymentsPageResponseSchema = pageResponseSchema(paymentResponseSchema)

export const isValidLocalDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const isPositivePrice = (value: string): boolean => {
  const price = Number(value)
  return value.trim().length > 0 && Number.isFinite(price) && price > 0
}

export const isValidPriceRange = (value: string): boolean => {
  const price = Number(value)
  return Number.isFinite(price) && price <= 99_999_999.99
}

export const clientFormSchema = z.object({
  email: z.string().trim().min(1, 'Ingresa el correo.').email('Ingresa un correo válido.').max(255),
  password: z
    .string()
    .min(6, 'Usa al menos 6 caracteres.')
    .max(72, 'La contraseña no puede superar 72 caracteres.'),
  firstName: z.string().trim().min(1, 'Ingresa el nombre.').max(100),
  lastName: z.string().trim().min(1, 'Ingresa el apellido.').max(100),
  phone: z.string().trim().max(20, 'El teléfono no puede superar 20 caracteres.'),
  documentNumber: z
    .string()
    .trim()
    .min(1, 'Ingresa el documento.')
    .max(20)
    .regex(/^[0-9A-Za-z-]+$/, 'Usa solo letras, números y guiones.'),
  birthDate: z.string(),
  sex: z.enum(['', 'M', 'F']),
  fitnessGoal: z.string().trim().max(100, 'El objetivo no puede superar 100 caracteres.'),
  addMembership: z.boolean(),
  membershipType: membershipTypeSchema,
  membershipPrice: z.string(),
  paymentMethod: paymentMethodSchema,
  reference: z.string().trim().max(100, 'La referencia no puede superar 100 caracteres.'),
  startDate: z.string(),
}).superRefine((values, context) => {
  if (values.birthDate && !isValidLocalDate(values.birthDate)) {
    context.addIssue({
      code: 'custom',
      path: ['birthDate'],
      message: 'Ingresa una fecha válida.',
    })
  }

  if (values.startDate && !isValidLocalDate(values.startDate)) {
    context.addIssue({
      code: 'custom',
      path: ['startDate'],
      message: 'Ingresa una fecha válida.',
    })
  }

  if (values.addMembership && (!isPositivePrice(values.membershipPrice) || !isValidPriceRange(values.membershipPrice))) {
    context.addIssue({
      code: 'custom',
      path: ['membershipPrice'],
      message: 'Ingresa un monto mayor que cero.',
    })
  }
})

export const membershipFormSchema = z.object({
  type: membershipTypeSchema,
  price: z.string().refine(isPositivePrice, 'Ingresa un monto mayor que cero.')
    .refine(isValidPriceRange, 'El monto supera el máximo permitido.'),
  method: paymentMethodSchema,
  reference: z.string().trim().max(100, 'La referencia no puede superar 100 caracteres.'),
  startDate: z.string(),
}).superRefine((values, context) => {
  if (values.startDate && !isValidLocalDate(values.startDate)) {
    context.addIssue({
      code: 'custom',
      path: ['startDate'],
      message: 'Ingresa una fecha válida.',
    })
  }
})

export type ClientResponse = z.infer<typeof clientResponseSchema>
export type MembershipResponse = z.infer<typeof membershipResponseSchema>
export type PaymentResponse = z.infer<typeof paymentResponseSchema>
export type ClientsPageResponse = z.infer<typeof clientsPageResponseSchema>
export type MembershipsPageResponse = z.infer<typeof membershipsPageResponseSchema>
export type PaymentsPageResponse = z.infer<typeof paymentsPageResponseSchema>
export type ClientFormValues = z.infer<typeof clientFormSchema>
export type MembershipFormValues = z.infer<typeof membershipFormSchema>
export type MembershipType = z.infer<typeof membershipTypeSchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export interface CreateClientRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string | null
  documentNumber: string
  birthDate: string | null
  sex: 'M' | 'F' | null
  fitnessGoal: string | null
}

export interface CreateMembershipRequest {
  clientId: number
  type: MembershipType
  price: number
  method: PaymentMethod
  reference: string | null
  startDate: string | null
}

export interface RenewMembershipRequest {
  type: MembershipType
  price: number
  method: PaymentMethod
  reference: string | null
}

export const membershipTypeLabels: Record<MembershipType, string> = {
  DAILY: 'Diaria',
  QUARTERLY: 'Quincenal',
  MONTHLY: 'Mensual',
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  NEQUI: 'Nequi',
}

export const membershipStatusLabels: Record<MembershipResponse['status'], string> = {
  ACTIVE: 'Activa',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
}

export const clientStatusLabel = (status: string): string => {
  if (status === 'ACTIVE') return 'Activo'
  if (status === 'DISABLED') return 'Deshabilitado'
  return status
}
