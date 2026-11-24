import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRoutines } from '../api/routineApi'
import type { RoutineTypeFilter } from '../model/routineTypes'

const pageSize = 10

export const useRoutineCatalog = (enabled = true) => {
  const [type, setType] = useState<RoutineTypeFilter>('ALL')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const routinesQuery = useQuery({
    queryKey: ['routines', { page, pageSize, type, search: debouncedSearch }],
    queryFn: () => getRoutines({ page, size: pageSize, type, search: debouncedSearch }),
    enabled,
  })

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(0)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDebouncedSearch(value.trim()), 300)
  }

  return {
    type,
    setType: (nextType: RoutineTypeFilter) => {
      setType(nextType)
      setPage(0)
    },
    search,
    setSearch: updateSearch,
    page,
    setPage,
    pageSize,
    routinesQuery,
  }
}
