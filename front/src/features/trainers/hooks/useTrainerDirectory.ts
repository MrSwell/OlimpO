import { useQuery } from '@tanstack/react-query'
import { getTrainers } from '../api/trainerApi'

export const useTrainerDirectory = (search: string, enabled = true) => {
  return useQuery({
    queryKey: ['trainers', { page: 0, size: 100, search }],
    queryFn: () => getTrainers({ page: 0, size: 100, search }),
    enabled,
  })
}
