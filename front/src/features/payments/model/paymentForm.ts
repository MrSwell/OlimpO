import { z } from 'zod'
import { paymentMethodSchema } from '@/features/clients/model/clientTypes'

const maxPaymentAmount = 99_999_999.99

export const paymentFormSchema = z.object({
  membershipId: z.string().min(1, 'Selecciona una membresía.'),
  amount: z.string().trim().superRefine((value, context) => {
    if (!value) {
      context.addIssue({ code: 'custom', message: 'Ingresa el monto.' })
      return
    }

    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
      context.addIssue({
        code: 'custom',
        message: 'Usa un monto válido con máximo 2 decimales.',
      })
      return
    }

    const amount = Number(value)
    if (amount <= 0) {
      context.addIssue({ code: 'custom', message: 'El monto debe ser mayor que cero.' })
    } else if (amount > maxPaymentAmount) {
      context.addIssue({
        code: 'custom',
        message: 'El monto supera el máximo permitido.',
      })
    }
  }),
  method: paymentMethodSchema,
  reference: z.string().trim().max(100, 'La referencia no puede superar 100 caracteres.'),
})

export type PaymentFormValues = z.infer<typeof paymentFormSchema>
