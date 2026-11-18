import { z } from 'zod'

export const inventoryMovementTypeSchema = z.enum(['INBOUND', 'OUTBOUND'])

export const inventoryItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  category: z.string().nullable(),
  quantity: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
  lowStock: z.boolean(),
  unit: z.string().nullable(),
})

export const inventoryMovementSchema = z.object({
  id: z.number().int().positive(),
  itemId: z.number().int().positive(),
  type: inventoryMovementTypeSchema,
  quantity: z.number().int().positive(),
  observation: z.string().nullable(),
  movementDate: z.string(),
})

const pageResponseSchema = <T extends z.ZodType>(contentSchema: T) =>
  z.object({
    content: z.array(contentSchema),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })

export const inventoryItemsPageSchema = pageResponseSchema(inventoryItemSchema)
export const inventoryMovementsPageSchema = pageResponseSchema(inventoryMovementSchema)

export type InventoryItemId = z.infer<typeof inventoryItemSchema>['id']
export type InventoryItem = z.infer<typeof inventoryItemSchema>
export type InventoryMovement = z.infer<typeof inventoryMovementSchema>
export type InventoryItemsPage = z.infer<typeof inventoryItemsPageSchema>
export type InventoryMovementsPage = z.infer<typeof inventoryMovementsPageSchema>
export type InventoryMovementType = z.infer<typeof inventoryMovementTypeSchema>

export type InventoryView = 'all' | 'low'

export const inventoryMovementTypeLabels: Record<
  InventoryMovementType,
  string
> = {
  INBOUND: 'Entrada',
  OUTBOUND: 'Salida',
}

export const formatStock = (item: Pick<InventoryItem, 'quantity' | 'unit'>): string =>
  item.unit ? `${item.quantity} ${item.unit}` : String(item.quantity)
