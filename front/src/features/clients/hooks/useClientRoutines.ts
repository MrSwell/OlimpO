import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClientRoutines } from '@/features/routines/api/routineApi'

const pageSize = 5

export const useClientRoutines = (clientId: number, enabled: boolean) => {
  const [page, setPage] = useState(0)

  const routinesQuery = useQuery({
    queryKey: ['client', clientId, 'routines', page, pageSize],
    queryFn: () => getClientRoutines(clientId, page, pageSize),
    enabled,
  })

  return { routinesQuery, page, setPage, pageSize }
}
