import { z } from 'zod'
import { inventoryMovementTypeSchema } from './inventoryTypes'

const maxStockQuantity = 999_999

const nonNegativeInteger = (message: string) =>
  z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (!/^\d+$/.test(value)) {
        context.addIssue({ code: 'custom', message })
        return
      }

      if (Number(value) > maxStockQuantity) {
        context.addIssue({ code: 'custom', message: 'El valor es demasiado grande.' })
      }
    })

export const inventoryItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre.').max(150, 'El nombre no puede superar 150 caracteres.'),
  category: z.string().trim().max(100, 'La categoría no puede superar 100 caracteres.'),
  quantity: nonNegativeInteger('Ingresa un stock válido (entero, sin negativos).'),
  minStock: nonNegativeInteger('Ingresa un mínimo válido (entero, sin negativos).'),
  unit: z.string().trim().max(20, 'La unidad no puede superar 20 caracteres.'),
})

export const movementFormSchema = z.object({
  type: inventoryMovementTypeSchema,
  quantity: z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (!/^\d+$/.test(value)) {
        context.addIssue({ code: 'custom', message: 'Ingresa una cantidad válida (entero mayor que cero).' })
        return
      }

      if (Number(value) < 1) {
        context.addIssue({ code: 'custom', message: 'La cantidad debe ser al menos 1.' })
      } else if (Number(value) > maxStockQuantity) {
        context.addIssue({ code: 'custom', message: 'La cantidad es demasiado grande.' })
      }
    }),
  observation: z.string().trim().max(255, 'La observación no puede superar 255 caracteres.'),
})

export type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>
export type MovementFormValues = z.infer<typeof movementFormSchema>
