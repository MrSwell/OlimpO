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

export type StockTone = 'ok' | 'near' | 'low'

export interface StockState {
  tone: StockTone
  label: string
}

/**
 * Presentation-level stock reading. `low` mirrors the backend's `lowStock`
 * (`quantity <= minStock`); `near` is a derived heads-up before items run out.
 */
export const getStockState = (
  item: Pick<InventoryItem, 'quantity' | 'minStock'>,
): StockState => {
  if (item.quantity <= item.minStock) return { tone: 'low', label: 'Stock bajo' }
  if (item.minStock > 0 && item.quantity < item.minStock * 1.5) {
    return { tone: 'near', label: 'Cerca del mínimo' }
  }
  return { tone: 'ok', label: 'Stock sano' }
}

export interface StockMeter {
  pct: number
  markerPct: number
  description: string
}

/** Bar scale: full width = twice the minimum, so the marker sits at 50%. */
export const getStockMeter = (
  item: Pick<InventoryItem, 'quantity' | 'minStock' | 'unit'>,
): StockMeter => {
  const scale = item.minStock > 0 ? item.minStock * 2 : Math.max(item.quantity, 8)
  const pct = Math.min(100, Math.round((item.quantity / scale) * 100))
  const unit = item.unit ? ` ${item.unit}` : ''
  return {
    pct,
    markerPct: item.minStock > 0 ? 50 : 0,
    description: `${item.quantity}${unit} de un mínimo de ${item.minStock}${unit}`,
  }
}

export const inventoryMovementTypeLabels: Record<
  InventoryMovementType,
  string
> = {
  INBOUND: 'Entrada',
  OUTBOUND: 'Salida',
}

export const formatStock = (item: Pick<InventoryItem, 'quantity' | 'unit'>): string =>
  item.unit ? `${item.quantity} ${item.unit}` : String(item.quantity)
