import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInventoryItem, getInventoryMovements } from '../api/inventoryApi'

const movementPageSize = 6

/**
 * Owns the item detail state: the item itself and its paginated movement
 * history. Shared by the detail page and its dialogs.
 */
export const useItemDetail = (rawItemId: string | undefined) => {
  const itemId = Number(rawItemId)
  const hasValidItemId = Number.isSafeInteger(itemId) && itemId > 0
  const [movementPage, setMovementPage] = useState(0)

  const itemQuery = useQuery({
    queryKey: ['inventory', itemId, 'item'],
    queryFn: () => getInventoryItem(itemId),
    enabled: hasValidItemId,
  })

  const movementsQuery = useQuery({
    queryKey: ['inventory', itemId, 'movements', movementPage, movementPageSize],
    queryFn: () => getInventoryMovements(itemId, movementPage, movementPageSize),
    enabled: hasValidItemId,
  })

  return {
    itemId,
    hasValidItemId,
    itemQuery,
    movementsQuery,
    movementPage,
    movementPageSize,
    setMovementPage,
  }
}
