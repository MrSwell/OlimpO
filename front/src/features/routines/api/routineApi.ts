import { apiRequest } from '@/lib/apiClient'
import {
  routineAssignmentsPageSchema,
  routineAssignmentSchema,
  routineSchema,
  routinesPageSchema,
  type Routine,
  type RoutineAssignmentsPage,
  type RoutinesPage,
  type RoutineType,
  type RoutineAssignmentStatus,
} from '../model/routineTypes'

export interface RoutineListOptions {
  page: number
  size: number
  search: string
  type: RoutineType | 'ALL'
}

export interface CreateRoutinePayload {
  name: string
  type: RoutineType
  description: string | null
  price: number | null
  trainerId: number | null
}

const routineQuery = (options: RoutineListOptions): string => {
  const params = new URLSearchParams({
    page: String(options.page),
    size: String(options.size),
  })

  if (options.search) params.set('search', options.search)
  if (options.type !== 'ALL') params.set('type', options.type)
  return params.toString()
}

export const getRoutines = async (options: RoutineListOptions): Promise<RoutinesPage> => {
  const response = await apiRequest<unknown>(`/routines?${routineQuery(options)}`)
  return routinesPageSchema.parse(response)
}

export const getRoutine = async (routineId: number): Promise<Routine> => {
  const response = await apiRequest<unknown>(`/routines/${routineId}`)
  return routineSchema.parse(response)
}

export const createRoutine = async (payload: CreateRoutinePayload): Promise<Routine> => {
  const response = await apiRequest<unknown>('/routines', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return routineSchema.parse(response)
}

export const assignRoutine = async (
  routineId: number,
  clientId: number,
  status: RoutineAssignmentStatus,
) => {
  const response = await apiRequest<unknown>(`/routines/${routineId}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ clientId, status }),
  })
  return routineAssignmentSchema.parse(response)
}

export const getRoutineAssignments = async (
  routineId: number,
  page: number,
  size: number,
  search = '',
): Promise<RoutineAssignmentsPage> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (search) params.set('search', search)
  const response = await apiRequest<unknown>(`/routines/${routineId}/assignments?${params}`)
  return routineAssignmentsPageSchema.parse(response)
}

export const getClientRoutines = async (
  clientId: number,
  page: number,
  size: number,
): Promise<RoutineAssignmentsPage> => {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  const response = await apiRequest<unknown>(`/clients/${clientId}/routines?${params}`)
  return routineAssignmentsPageSchema.parse(response)
}
