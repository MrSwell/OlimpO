import { z } from 'zod'

export const routineTypeSchema = z.enum(['GENERAL', 'CUSTOM'])
export const routineTypeFilterSchema = z.enum(['ALL', 'GENERAL', 'CUSTOM'])
export const routineAssignmentStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED'])

export const routineSchema = z.object({
  id: z.number().int().positive(),
  trainerId: z.number().int().positive().nullable(),
  trainerName: z.string().nullable(),
  name: z.string(),
  type: routineTypeSchema,
  description: z.string().nullable(),
  price: z.number().nullable(),
})

export const routineAssignmentSchema = z.object({
  id: z.number().int().positive(),
  routineId: z.number().int().positive(),
  routineName: z.string().nullable(),
  clientId: z.number().int().positive(),
  clientName: z.string().nullable(),
  assignmentDate: z.string(),
  status: routineAssignmentStatusSchema,
})

const pageResponseSchema = <T extends z.ZodType>(contentSchema: T) =>
  z.object({
    content: z.array(contentSchema),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })

export const routinesPageSchema = pageResponseSchema(routineSchema)
export const routineAssignmentsPageSchema = pageResponseSchema(routineAssignmentSchema)

export type Routine = z.infer<typeof routineSchema>
export type RoutineType = z.infer<typeof routineTypeSchema>
export type RoutineAssignment = z.infer<typeof routineAssignmentSchema>
export type RoutineAssignmentStatus = z.infer<typeof routineAssignmentStatusSchema>
export type RoutinesPage = z.infer<typeof routinesPageSchema>
export type RoutineAssignmentsPage = z.infer<typeof routineAssignmentsPageSchema>

export type RoutineTypeFilter = z.infer<typeof routineTypeFilterSchema>

export const routineTypeLabels: Record<RoutineType, string> = {
  GENERAL: 'General',
  CUSTOM: 'Personalizada',
}

export const routineAssignmentStatusLabels: Record<RoutineAssignmentStatus, string> = {
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}
