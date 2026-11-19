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

export type CategoryKey =
  | 'equipment'
  | 'supplements'
  | 'drinks'
  | 'accessories'
  | 'apparel'
  | 'other'

export const categoryPresetLabels: Record<Exclude<CategoryKey, 'other'>, string> = {
  equipment: 'Equipamiento',
  supplements: 'Suplementos',
  drinks: 'Bebidas',
  accessories: 'Accesorios',
  apparel: 'Ropa',
}

const categoryKeywords: Record<Exclude<CategoryKey, 'other'>, string[]> = {
  equipment: ['equip', 'maquin', 'pesa', 'peso', 'barra', 'colchon', 'mancuern', 'disco', 'banda elastica'],
  supplements: ['supl', 'prote', 'creatina', 'vitamin', 'preentreno', 'whey', 'amino'],
  drinks: ['bebida', 'agua', 'isoton', 'energet', 'gaseosa', 'jugo'],
  accessories: ['acces', 'guante', 'cinta', 'cuerda', 'shaker', 'toalla', 'rodillera', 'munequera'],
  apparel: ['ropa', 'camis', 'pantal', 'sudader', 'short', 'medias', 'uniform'],
}

export const normalizeCategoryName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

/**
 * Resolves the presentation key for a free-text category. Known presets map
 * by keyword; anything else falls back to `other` (which gets a stable
 * hash-derived accent via the identity palette).
 */
export const resolveCategoryKey = (category: string | null): CategoryKey => {
  if (!category) return 'other'
  const normalized = normalizeCategoryName(category)
  const entries = Object.entries(categoryKeywords) as Array<
    [Exclude<CategoryKey, 'other'>, string[]]
  >
  for (const [key, keywords] of entries) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return key
  }
  return 'other'
}

export const inventoryMovementTypeLabels: Record<
  InventoryMovementType,
  string
> = {
  INBOUND: 'Entrada',
  OUTBOUND: 'Salida',
}

/**
 * A unit is a word ("unidad", "caja"). Numeric units come from legacy free-text
 * entries and would duplicate the stock number, so they are not displayed.
 */
export const displayUnit = (unit: string | null): string | null => {
  const trimmed = unit?.trim()
  if (!trimmed) return null
  return /^\d+$/.test(trimmed) ? null : trimmed
}

export const formatStock = (item: Pick<InventoryItem, 'quantity' | 'unit'>): string => {
  const unit = displayUnit(item.unit)
  return unit ? `${item.quantity} ${unit}` : String(item.quantity)
}
