import { z } from 'zod'

export const routineFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Escribe el nombre de la rutina.').max(150),
    type: z.enum(['GENERAL', 'CUSTOM']),
    description: z.string().max(2000, 'La descripción no puede superar 2000 caracteres.'),
    price: z.string(),
    trainerId: z.string(),
  })
  .superRefine((values, context) => {
    if (values.type !== 'CUSTOM') return

    const price = Number(values.price)
    if (!Number.isFinite(price) || price <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'La rutina personalizada requiere un precio mayor que cero.',
      })
    }

    if (values.trainerId && (!Number.isInteger(Number(values.trainerId)) || Number(values.trainerId) < 1)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trainerId'],
        message: 'Selecciona un entrenador válido.',
      })
    }
  })

export type RoutineFormValues = z.infer<typeof routineFormSchema>

export const routineFormDefaultValues: RoutineFormValues = {
  name: '',
  type: 'GENERAL',
  description: '',
  price: '',
  trainerId: '',
}
