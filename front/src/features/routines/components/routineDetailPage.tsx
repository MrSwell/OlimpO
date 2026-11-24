/* oxlint-disable react/rules-of-hooks */
import { useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  LuArrowLeft as luArrowLeft,
  LuDumbbell as luDumbbell,
  LuUserRoundPlus as luUserRoundPlus,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { useRoutineDetail } from '../hooks/useRoutineDetail'
import {
  routineAssignmentStatusLabels,
  routineTypeLabels,
  type RoutineAssignment,
  type RoutineAssignmentStatus,
} from '../model/routineTypes'
import * as routineAssignmentDialogComponents from './routineAssignmentDialog'
import './routineFeature.css'

const assignmentPageSize = 10

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const assignmentStatusClassName: Record<RoutineAssignmentStatus, string> = {
  ACTIVE: 'routineFeature__status--active',
  COMPLETED: 'routineFeature__status--completed',
  CANCELLED: 'routineFeature__status--cancelled',
}

const assignmentRow = (assignment: RoutineAssignment) => (
  <li key={assignment.id} className="routineFeature__assignmentItem">
    <span className="routineFeature__assignmentBody">
      <span className="routineFeature__assignmentName">
        {assignment.clientName || `Cliente #${assignment.clientId}`}
      </span>
      <span className="routineFeature__assignmentDate">
        {dateFormatter.format(new Date(`${assignment.assignmentDate}T00:00:00`))}
      </span>
    </span>
    <span className={`routineFeature__status ${assignmentStatusClassName[assignment.status]}`}>
      <span aria-hidden="true" />
      {routineAssignmentStatusLabels[assignment.status]}
    </span>
  </li>
)

export const routineDetailPage = () => {
  const params = useParams()
  const navigate = useNavigate()
  const roles = useAuthStore((state) => state.roles)
  const routineId = Number(params.routineId)
  const isClient = roles.includes('CLIENT') && !roles.some((role) =>
    ['ADMIN', 'TRAINER_MANAGER', 'TRAINER'].includes(role),
  )
  const canManage = roles.some((role) => ['ADMIN', 'TRAINER_MANAGER', 'TRAINER'].includes(role))
  const [assignmentPage, setAssignmentPage] = useState(0)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const { routineQuery, assignmentsQuery } = useRoutineDetail(
    routineId,
    !isClient,
    assignmentPage,
    assignmentPageSize,
  )
  const routine = routineQuery.data
  const assignments = assignmentsQuery.data

  if (!Number.isInteger(routineId) || routineId < 1) {
    return (
      <>
        <componentComponents.pageHead title="Rutina no válida" />
        <componentComponents.panel>
          <componentComponents.emptyState
            title="No encontramos esta rutina"
            description="Vuelve al catálogo y selecciona una rutina válida."
            action={
              <componentComponents.button variant="default" onClick={() => navigate('/routines')}>
                Volver a rutinas
              </componentComponents.button>
            }
          />
        </componentComponents.panel>
      </>
    )
  }

  if (routineQuery.isPending) {
    return (
      <>
        <componentComponents.pageHead title="Rutina" />
        <componentComponents.panel>
          <p className="py-12 text-center text-sm text-muted">Cargando rutina…</p>
        </componentComponents.panel>
      </>
    )
  }

  if (routineQuery.isError || !routine) {
    return (
      <>
        <componentComponents.pageHead title="Rutina no disponible" />
        <componentComponents.panel>
          <componentComponents.emptyState
            icon={luDumbbell}
            title="No se pudo cargar la rutina"
            description="Puede que ya no esté disponible. Vuelve al catálogo e inténtalo de nuevo."
            action={
              <componentComponents.button variant="default" onClick={() => navigate('/routines')}>
                Volver a rutinas
              </componentComponents.button>
            }
          />
        </componentComponents.panel>
      </>
    )
  }

  const routineHeader = (
    <componentComponents.pageHead
      title={routine.name}
      lede={`${routineTypeLabels[routine.type]}${routine.trainerName ? ` · ${routine.trainerName}` : ''}`}
      actions={
        <>
          <componentComponents.button
            variant="quiet"
            size="sm"
            icon={luArrowLeft}
            onClick={() => navigate('/routines')}
          >
            Catálogo
          </componentComponents.button>
          {canManage && (
            <componentComponents.button
              variant="primary"
              size="sm"
              icon={luUserRoundPlus}
              onClick={() => setIsAssignDialogOpen(true)}
            >
              Asignar
            </componentComponents.button>
          )}
        </>
      }
    />
  )

  return (
    <>
      {routineHeader}

      <div
        className={`routineFeature__detailLayout${
          isClient ? ' routineFeature__detailLayout--single' : ''
        }`}
      >
        <section
          className="routineFeature__panel"
          aria-labelledby="routine-overview-heading"
          style={{ viewTransitionName: `routine-${routine.id}` } as CSSProperties}
        >
          <div className="routineFeature__detailHead">
            <div>
              <h2 id="routine-overview-heading" className="text-[15px] font-semibold">
                Resumen
              </h2>
              <p className="mt-1 text-xs text-muted">
                {routine.type === 'GENERAL'
                  ? 'Programa disponible para consulta y asignación.'
                  : 'Programa personalizado asociado a un entrenador.'}
              </p>
            </div>
            <span className="routineFeature__typeTag" data-type={routine.type}>
              {routineTypeLabels[routine.type]}
            </span>
          </div>

          <p className="routineFeature__detailDescription">
            {routine.description || 'No se agregó una descripción para esta rutina.'}
          </p>

          <dl className="routineFeature__detailGrid">
            <div>
              <dt>Entrenador</dt>
              <dd>{routine.trainerName || 'Sin entrenador asociado'}</dd>
            </div>
            <div>
              <dt>Precio</dt>
              <dd>
                {routine.price === null
                  ? 'Sin costo adicional'
                  : priceFormatter.format(routine.price)}
              </dd>
            </div>
          </dl>
        </section>

        {!isClient && (
          <aside
            className="routineFeature__assignments"
            aria-labelledby="routine-assignments-heading"
          >
            <div className="routineFeature__detailHead">
              <div>
                <h2 id="routine-assignments-heading" className="text-[15px] font-semibold">
                  Asignaciones
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {assignments ? `${assignments.totalElements} en total` : 'Clientes y estados'}
                </p>
              </div>
            </div>

            {assignmentsQuery.isPending ? (
              <p className="py-10 text-center text-sm text-muted">Cargando asignaciones…</p>
            ) : assignmentsQuery.isError || !assignments ? (
              <componentComponents.emptyState
                title="No se pudo cargar el historial"
                description="La rutina está disponible, pero el historial no pudo cargarse."
                action={
                  <componentComponents.button
                    variant="default"
                    onClick={() => void assignmentsQuery.refetch()}
                  >
                    Reintentar
                  </componentComponents.button>
                }
              />
            ) : assignments.content.length === 0 ? (
              <p className="routineFeature__summaryEmpty">
                Cuando se asigne esta rutina, aparecerá aquí.
              </p>
            ) : (
              <>
                <ul className="routineFeature__assignmentList" role="list">
                  {assignments.content.map(assignmentRow)}
                </ul>
                {assignments.totalPages > 1 && (
                  <componentComponents.pagination
                    page={assignmentPage + 1}
                    pageSize={assignmentPageSize}
                    totalItems={assignments.totalElements}
                    totalPages={assignments.totalPages}
                    onPageChange={(nextPage) => setAssignmentPage(nextPage - 1)}
                  />
                )}
              </>
            )}
          </aside>
        )}
      </div>

      {isClient && (
        <p className="routineFeature__clientNote">
          <Link to="/routines">Volver a mis rutinas</Link>
        </p>
      )}

      {canManage && (
        <routineAssignmentDialogComponents.routineAssignmentDialog
          open={isAssignDialogOpen}
          routineId={routine.id}
          routineName={routine.name}
          onClose={() => setIsAssignDialogOpen(false)}
        />
      )}
    </>
  )
}
