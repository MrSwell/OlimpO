import { apiRequest } from '@/lib/apiClient'
import { scheduleSlotsSchema, type ScheduleSlotPayload } from '../model/scheduleTypes'

export const getWeeklySchedule = async (trainerId: number) => {
  const response = await apiRequest<unknown>(`/trainers/${trainerId}/schedules`)
  return scheduleSlotsSchema.parse(response)
}

export const saveWeeklySchedule = async (trainerId: number, slots: ScheduleSlotPayload[]) => {
  const response = await apiRequest<unknown>(`/trainers/${trainerId}/schedules`, {
    method: 'POST',
    body: JSON.stringify(slots),
  })
  return scheduleSlotsSchema.parse(response)
}
