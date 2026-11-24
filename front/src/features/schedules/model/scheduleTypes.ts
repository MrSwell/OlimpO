import { z } from 'zod'

export const scheduleStatusSchema = z.enum(['AVAILABLE', 'NOT_AVAILABLE', 'RESERVED'])

export const scheduleSlotSchema = z.object({
  id: z.number().int().positive(),
  trainerId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(1).max(7),
  dayName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: scheduleStatusSchema,
})

export const scheduleSlotsSchema = z.array(scheduleSlotSchema)

export type ScheduleSlot = z.infer<typeof scheduleSlotSchema>
export type ScheduleStatus = z.infer<typeof scheduleStatusSchema>

export interface ScheduleSlotPayload {
  dayOfWeek: number
  startTime: string
  endTime: string
  status: ScheduleStatus
}

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  AVAILABLE: 'Disponible',
  NOT_AVAILABLE: 'No disponible',
  RESERVED: 'Reservado',
}

// Display order starts on Monday; values keep the backend convention 1 = Sunday … 7 = Saturday.
export const scheduleDays = [
  { value: 2, label: 'Lunes' },
  { value: 3, label: 'Martes' },
  { value: 4, label: 'Miércoles' },
  { value: 5, label: 'Jueves' },
  { value: 6, label: 'Viernes' },
  { value: 7, label: 'Sábado' },
  { value: 1, label: 'Domingo' },
] as const
