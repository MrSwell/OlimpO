import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInventoryItems, getLowStockItems } from '../api/inventoryApi'
import type { InventoryView } from '../model/inventoryTypes'

const pageSize = 10

export const useInventoryDirectory = () => {
  const [view, setView] = useState<InventoryView>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const itemsQuery = useQuery({
    queryKey: ['inventory', view, page, pageSize, debouncedSearch],
    queryFn: () => {
      const options = { page, size: pageSize, search: debouncedSearch }
      return view === 'low' ? getLowStockItems(options) : getInventoryItems(options)
    },
  })

  return {
    view,
    setView: (nextView: InventoryView) => {
      setView(nextView)
      setPage(0)
    },
    search,
    setSearch: (value: string) => {
      setSearch(value)
      setPage(0)

      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setDebouncedSearch(value.trim()), 300)
    },
    debouncedSearch,
    page,
    setPage,
    pageSize,
    itemsQuery,
  }
}
