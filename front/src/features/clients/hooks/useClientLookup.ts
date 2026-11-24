import { useQuery } from '@tanstack/react-query'
import { getClientLookup } from '../api/clientApi'

export const useClientLookup = (search: string, enabled = true) => {
  return useQuery({
    queryKey: ['client-lookup', { page: 0, size: 100, search }],
    queryFn: () => getClientLookup({ page: 0, size: 100, search }),
    enabled,
  })
}
