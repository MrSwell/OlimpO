import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../api/clientApi'

const pageSize = 10

export const useClientDirectory = () => {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const clientsQuery = useQuery({
    queryKey: ['clients', 'directory', page, pageSize, debouncedSearch],
    queryFn: () => getClients({ page, size: pageSize, search: debouncedSearch }),
  })

  return {
    search,
    setSearch: (value: string) => {
      setSearch(value)
      setPage(0)

      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setDebouncedSearch(value.trim()), 300)
    },
    page,
    setPage,
    pageSize,
    clientsQuery,
  }
}
