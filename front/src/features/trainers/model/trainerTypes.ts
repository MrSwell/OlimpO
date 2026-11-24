import { z } from 'zod'

export const trainerOptionSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string(),
  lastName: z.string(),
  specialty: z.string().nullable(),
})

export const trainerOptionsPageSchema = z.object({
  content: z.array(trainerOptionSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export type TrainerOption = z.infer<typeof trainerOptionSchema>
export type TrainerOptionsPage = z.infer<typeof trainerOptionsPageSchema>
