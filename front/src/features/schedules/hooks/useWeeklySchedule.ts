import { useQuery } from '@tanstack/react-query'
import { getWeeklySchedule } from '../api/scheduleApi'

export const useWeeklySchedule = (trainerId: number | null) => {
  return useQuery({
    queryKey: ['trainer-schedule', trainerId],
    queryFn: () => {
      if (trainerId === null) throw new Error('Selecciona un entrenador.')
      return getWeeklySchedule(trainerId)
    },
    enabled: trainerId !== null && trainerId > 0,
  })
}
