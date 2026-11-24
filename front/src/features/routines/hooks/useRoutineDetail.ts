import { useQuery } from '@tanstack/react-query'
import { getRoutine, getRoutineAssignments } from '../api/routineApi'

export const useRoutineDetail = (
  routineId: number,
  canViewAssignments: boolean,
  assignmentPage: number,
  pageSize: number,
) => {
  const routineQuery = useQuery({
    queryKey: ['routine', routineId],
    queryFn: () => getRoutine(routineId),
    enabled: Number.isInteger(routineId) && routineId > 0,
  })

  const assignmentsQuery = useQuery({
    queryKey: ['routine-assignments', routineId, { page: assignmentPage, size: pageSize }],
    queryFn: () => getRoutineAssignments(routineId, assignmentPage, pageSize),
    enabled: canViewAssignments && Number.isInteger(routineId) && routineId > 0,
  })

  return { routineQuery, assignmentsQuery }
}
