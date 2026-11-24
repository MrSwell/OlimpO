/* oxlint-disable react/rules-of-hooks */
import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import {
  LuArrowUpRight as luArrowUpRight,
  LuChevronRight as luChevronRight,
  LuDumbbell as luDumbbell,
  LuPlus as luPlus,
  LuTarget as luTarget,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { useMyRoutineAssignments } from '../hooks/useMyRoutineAssignments'
import { useRoutineCatalog } from '../hooks/useRoutineCatalog'
import {
  routineAssignmentStatusLabels,
  routineTypeFilterSchema,
  routineTypeLabels,
  type Routine,
  type RoutineAssignment,
  type RoutineAssignmentStatus,
  type RoutineType,
} from '../model/routineTypes'
import * as routineFormDialogComponents from './routineFormDialog'
import './routineFeature.css'

const pageSize = 10
const myRoutinePageSize = 20

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

const routineAccent: Record<RoutineType, string> = {
  GENERAL: 'var(--accent-blue)',
  CUSTOM: 'var(--gold)',
}

const assignmentStatus = (status: RoutineAssignmentStatus) => (
  <span className={`routineFeature__status ${assignmentStatusClassName[status]}`}>
    <span aria-hidden="true" />
    {routineAssignmentStatusLabels[status]}
  </span>
)

const formatPrice = (price: number | null) =>
  price === null ? 'Sin costo' : priceFormatter.format(price)

const routineCard = (routine: Routine) => (
  <Link
    to={`/routines/${routine.id}`}
    viewTransition
    className="routineFeature__routineCard"
    aria-label={`Ver ficha de ${routine.name}`}
    style={
      {
        viewTransitionName: `routine-${routine.id}`,
        '--card-accent': routineAccent[routine.type],
      } as CSSProperties
    }
  >
    <div className="routineFeature__routineHeader">
      <span className="routineFeature__routineIcon" aria-hidden="true">
        <componentComponents.icon
          icon={routine.type === 'CUSTOM' ? luTarget : luDumbbell}
          size="md"
        />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="routineFeature__routineName">{routine.name}</h3>
        <p className="routineFeature__routineTrainer">
          {routine.trainerName || 'Sin entrenador asociado'}
        </p>
      </div>
    </div>

    <p className="routineFeature__routineDescription">
      {routine.description || 'Sin descripción registrada.'}
    </p>

    <footer className="routineFeature__routineFooter">
      <span className="routineFeature__typeTag" data-type={routine.type}>
        {routineTypeLabels[routine.type]}
      </span>
      <span className="routineFeature__routinePrice">{formatPrice(routine.price)}</span>
      <componentComponents.icon icon={luArrowUpRight} size="sm" />
    </footer>
  </Link>
)

const assignmentRow = (assignment: RoutineAssignment) => (
  <Link
    to={`/routines/${assignment.routineId}`}
    viewTransition
    className="routineFeature__assignmentRow"
  >
    <span className="routineFeature__assignmentIcon" aria-hidden="true">
      <componentComponents.icon icon={luDumbbell} size="sm" />
    </span>
    <span className="routineFeature__assignmentBody">
      <span className="routineFeature__assignmentName">
        {assignment.routineName || 'Rutina sin nombre'}
      </span>
      <span className="routineFeature__assignmentDate">
        Asignada el {dateFormatter.format(new Date(`${assignment.assignmentDate}T00:00:00`))}
      </span>
    </span>
    {assignmentStatus(assignment.status)}
    <componentComponents.icon icon={luChevronRight} size="sm" />
  </Link>
)

export const routinesPage = () => {
  const roles = useAuthStore((state) => state.roles)
  const isTrainingStaff = roles.some((role) =>
    ['ADMIN', 'TRAINER_MANAGER', 'TRAINER'].includes(role),
  )
  const isClient = roles.includes('CLIENT') && !isTrainingStaff
  const isSupervisor = roles.includes('ADMIN') || roles.includes('TRAINER_MANAGER')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [myPage, setMyPage] = useState(0)
  const catalog = useRoutineCatalog(!isClient)
  const myAssignments = useMyRoutineAssignments(isClient, myPage, myRoutinePageSize)

  if (isClient) {
    const clientId = myAssignments.clientQuery.data?.content[0]?.id
    const assignments = myAssignments.assignmentsQuery.data
    const header = <componentComponents.pageHead title="Mis rutinas" lede="Consulta las rutinas asignadas a tu perfil." />

    if (
      myAssignments.clientQuery.isPending ||
      (clientId !== undefined && myAssignments.assignmentsQuery.isPending)
    ) {
      return (
        <>
          {header}
          <componentComponents.panel>
            <p className="py-12 text-center text-sm text-muted">Cargando tus rutinas…</p>
          </componentComponents.panel>
        </>
      )
    }

    if (myAssignments.clientQuery.isError || myAssignments.assignmentsQuery.isError) {
      return (
        <>
          {header}
          <componentComponents.panel>
            <componentComponents.emptyState
              icon={luDumbbell}
              title="No se pudieron cargar tus rutinas"
              description="Comprueba tu conexión e inténtalo de nuevo."
              action={
                <componentComponents.button
                  variant="default"
                  onClick={() => {
                    void myAssignments.clientQuery.refetch()
                    void myAssignments.assignmentsQuery.refetch()
                  }}
                >
                  Reintentar
                </componentComponents.button>
              }
            />
          </componentComponents.panel>
        </>
      )
    }

    return (
      <>
        {header}
        <section className="routineFeature__panel">
          {!clientId ? (
            <componentComponents.emptyState
              icon={luDumbbell}
              title="No encontramos tu perfil de cliente"
              description="Contacta con recepción para revisar tu cuenta."
            />
          ) : !assignments?.content.length ? (
            <componentComponents.emptyState
              icon={luDumbbell}
              title="Aún no tienes rutinas asignadas"
              description="Cuando tu entrenador te asigne una rutina, aparecerá aquí."
            />
          ) : (
            <>
              <ul className="routineFeature__assignmentList" role="list">
                {assignments.content.map((assignment) => (
                  <li key={assignment.id}>{assignmentRow(assignment)}</li>
                ))}
              </ul>
              {assignments.totalPages > 1 && (
                <componentComponents.pagination
                  page={myPage + 1}
                  pageSize={myRoutinePageSize}
                  totalItems={assignments.totalElements}
                  totalPages={assignments.totalPages}
                  onPageChange={(nextPage) => setMyPage(nextPage - 1)}
                />
              )}
            </>
          )}
        </section>
      </>
    )
  }

  const data = catalog.routinesQuery.data
  const header = (
    <componentComponents.pageHead
      title="Rutinas"
      lede="Consulta programas generales y rutinas personalizadas del gimnasio."
      actions={
        isTrainingStaff ? (
          <componentComponents.button
            variant="primary"
            size="sm"
            icon={luPlus}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Nueva rutina
          </componentComponents.button>
        ) : undefined
      }
    />
  )

  const pageRoutines = data?.content ?? []
  const generalCount = pageRoutines.filter((routine) => routine.type === 'GENERAL').length
  const customCount = pageRoutines.length - generalCount
  const pricedRoutines = pageRoutines.filter(
    (routine): routine is Routine & { price: number } => routine.price !== null,
  )
  const lowestPrice = pricedRoutines.length
    ? Math.min(...pricedRoutines.map((routine) => routine.price))
    : null
  const highestPrice = pricedRoutines.length
    ? Math.max(...pricedRoutines.map((routine) => routine.price))
    : null

  return (
    <>
      {header}

      <div className="routineFeature__filters mb-5">
        <componentComponents.searchInput
          id="routine-search"
          aria-label="Buscar rutinas por nombre o descripción"
          autoComplete="off"
          value={catalog.search}
          onChange={(event) => catalog.setSearch(event.currentTarget.value)}
          placeholder="Nombre o descripción"
          className="routineFeature__search"
        />
        <componentComponents.select
          id="routine-type-filter"
          aria-label="Filtrar rutinas por tipo"
          value={catalog.type}
          onChange={(event) =>
            catalog.setType(routineTypeFilterSchema.parse(event.currentTarget.value))
          }
          className="routineFeature__typeFilter"
        >
          <option value="ALL">Todos los tipos</option>
          <option value="GENERAL">Generales</option>
          <option value="CUSTOM">Personalizadas</option>
        </componentComponents.select>

        <p aria-live="polite" className="ml-auto text-xs text-faint">
          {catalog.routinesQuery.isFetching
            ? 'Actualizando…'
            : `${data?.totalElements ?? 0} rutinas`}
        </p>
      </div>

      {catalog.routinesQuery.isPending ? (
        <section className="routineFeature__panel">
          <p className="py-12 text-center text-sm text-muted">Cargando rutinas…</p>
        </section>
      ) : catalog.routinesQuery.isError || !data ? (
        <section className="routineFeature__panel">
          <componentComponents.emptyState
            icon={luDumbbell}
            title="No se pudieron cargar las rutinas"
            description="Comprueba tu conexión y vuelve a intentarlo."
            action={
              <componentComponents.button
                variant="default"
                onClick={() => void catalog.routinesQuery.refetch()}
              >
                Reintentar
              </componentComponents.button>
            }
          />
        </section>
      ) : data.content.length === 0 ? (
        <section className="routineFeature__panel">
          <componentComponents.emptyState
            icon={luDumbbell}
            title="No hay rutinas para mostrar"
            description={
              catalog.search || catalog.type !== 'ALL'
                ? 'Prueba con otros filtros.'
                : 'Las rutinas disponibles aparecerán aquí.'
            }
            action={
              isTrainingStaff ? (
                <componentComponents.button
                  variant="default"
                  onClick={() => setIsCreateDialogOpen(true)}
                  icon={luPlus}
                >
                  Crear primera rutina
                </componentComponents.button>
              ) : undefined
            }
          />
        </section>
      ) : (
        <div className="routineFeature__layout">
          <ul className="routineFeature__grid" role="list">
            {data.content.map((routine) => (
              <li key={routine.id} className="routineFeature__gridItem">
                {routineCard(routine)}
              </li>
            ))}
          </ul>

          <aside className="routineFeature__aside" aria-label="Resumen de rutinas">
            <section className="routineFeature__summaryCard">
              <h2 className="routineFeature__summaryTitle">Composición</h2>
              <dl className="routineFeature__summaryList">
                <div>
                  <dt>Generales</dt>
                  <dd>{generalCount}</dd>
                </div>
                <div>
                  <dt>Personalizadas</dt>
                  <dd>{customCount}</dd>
                </div>
              </dl>
            </section>

            <section className="routineFeature__summaryCard">
              <h2 className="routineFeature__summaryTitle">Precios en esta página</h2>
              {lowestPrice === null || highestPrice === null ? (
                <p className="routineFeature__summaryEmpty">Ninguna rutina tiene precio asignado.</p>
              ) : (
                <dl className="routineFeature__summaryList">
                  <div>
                    <dt>Desde</dt>
                    <dd>{priceFormatter.format(lowestPrice)}</dd>
                  </div>
                  <div>
                    <dt>Hasta</dt>
                    <dd>{priceFormatter.format(highestPrice)}</dd>
                  </div>
                </dl>
              )}
            </section>
          </aside>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <componentComponents.pagination
          page={catalog.page + 1}
          pageSize={pageSize}
          totalItems={data.totalElements}
          totalPages={data.totalPages}
          onPageChange={(nextPage) => catalog.setPage(nextPage - 1)}
        />
      )}

      <routineFormDialogComponents.routineFormDialog
        open={isCreateDialogOpen}
        isSupervisor={isSupervisor}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  )
}
