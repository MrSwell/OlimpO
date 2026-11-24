import { apiRequest } from '@/lib/apiClient'
import {
  trainerOptionsPageSchema,
  type TrainerOptionsPage,
} from '../model/trainerTypes'

export interface TrainerListOptions {
  page: number
  size: number
  search: string
}

export const getTrainers = async (options: TrainerListOptions): Promise<TrainerOptionsPage> => {
  const params = new URLSearchParams({
    page: String(options.page),
    size: String(options.size),
  })

  if (options.search) params.set('search', options.search)
  const response = await apiRequest<unknown>(`/trainers?${params}`)
  return trainerOptionsPageSchema.parse(response)
}
