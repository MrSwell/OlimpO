import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMachines } from '../api/machineApi'
import type { MachineStatusFilter } from '../model/machineTypes'

const pageSize = 10

export const useMachinesDirectory = () => {
  const [status, setStatus] = useState<MachineStatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const machinesQuery = useQuery({
    queryKey: ['machines', status, page, pageSize, debouncedSearch],
    queryFn: () => getMachines({ page, size: pageSize, search: debouncedSearch, status }),
  })

  return {
    status,
    setStatus: (nextStatus: MachineStatusFilter) => {
      setStatus(nextStatus)
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
    machinesQuery,
  }
}
