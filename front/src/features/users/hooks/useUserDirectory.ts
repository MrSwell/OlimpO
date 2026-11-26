import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../api/userApi'

const pageSize = 10

export const useUserDirectory = () => {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const usersQuery = useQuery({
    queryKey: ['users', { page, pageSize, search: debouncedSearch }],
    queryFn: () => getUsers({ page, size: pageSize, search: debouncedSearch }),
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
    usersQuery,
  }
}
