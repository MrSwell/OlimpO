import { apiRequest } from '@/lib/apiClient'
import {
  inventoryItemSchema,
  inventoryItemsPageSchema,
  inventoryMovementSchema,
  inventoryMovementsPageSchema,
  type InventoryItem,
  type InventoryItemsPage,
  type InventoryMovement,
  type InventoryMovementsPage,
  type InventoryMovementType,
} from '../model/inventoryTypes'

export interface InventoryItemPayload {
  name: string
  category: string | null
  quantity: number
  minStock: number
  unit: string | null
}

export interface InventoryMovementPayload {
  type: InventoryMovementType
  quantity: number
  observation: string | null
}

export interface InventoryListOptions {
  page: number
  size: number
  search: string
}

const createQuery = (options: InventoryListOptions): string => {
  const params = new URLSearchParams({
    page: String(options.page),
    size: String(options.size),
  })

  if (options.search) params.set('search', options.search)
  return params.toString()
}

export const getInventoryItems = async (
  options: InventoryListOptions,
): Promise<InventoryItemsPage> => {
  const response = await apiRequest<unknown>(`/inventory/items?${createQuery(options)}`)
  return inventoryItemsPageSchema.parse(response)
}

export const getLowStockItems = async (
  options: InventoryListOptions,
): Promise<InventoryItemsPage> => {
  const response = await apiRequest<unknown>(`/inventory/items/low-stock?${createQuery(options)}`)
  return inventoryItemsPageSchema.parse(response)
}

export const getInventoryItem = async (itemId: number): Promise<InventoryItem> => {
  const response = await apiRequest<unknown>(`/inventory/items/${itemId}`)
  return inventoryItemSchema.parse(response)
}

export const createInventoryItem = async (
  payload: InventoryItemPayload,
): Promise<InventoryItem> => {
  const response = await apiRequest<unknown>('/inventory/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return inventoryItemSchema.parse(response)
}

export const updateInventoryItem = async (
  itemId: number,
  payload: InventoryItemPayload,
): Promise<InventoryItem> => {
  const response = await apiRequest<unknown>(`/inventory/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return inventoryItemSchema.parse(response)
}

export const deleteInventoryItem = async (itemId: number): Promise<void> => {
  await apiRequest<void>(`/inventory/items/${itemId}`, { method: 'DELETE' })
}

export const registerInventoryMovement = async (
  itemId: number,
  payload: InventoryMovementPayload,
): Promise<InventoryMovement> => {
  const response = await apiRequest<unknown>(`/inventory/items/${itemId}/movements`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return inventoryMovementSchema.parse(response)
}

export const getInventoryMovements = async (
  itemId: number,
  page: number,
  size: number,
): Promise<InventoryMovementsPage> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const response = await apiRequest<unknown>(`/inventory/items/${itemId}/movements?${params}`)
  return inventoryMovementsPageSchema.parse(response)
}
