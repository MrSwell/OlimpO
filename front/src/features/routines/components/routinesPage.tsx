/* oxlint-disable react/rules-of-hooks */
import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import {
  LuArrowUpRight as luArrowUpRight,
  LuBookOpen as luBookOpen,
  LuChevronRight as luChevronRight,
  LuDumbbell as luDumbbell,
  LuPlus as luPlus,
  LuTarget as luTarget,
  LuUserRound as luUserRound,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { useMyRoutineAssignments } from '../hooks/useMyRoutineAssignments'
import { useRoutineCatalog } from '../hooks/useRoutineCatalog'
import {
  routineAssignmentStatusLabels,
  routineTypeLabels,
  type Routine,
  type RoutineAssignment,
  type RoutineAssignmentStatus,
  type RoutineType,
  type RoutineTypeFilter,
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

const typeIcons = {
  GENERAL: luBookOpen,
  CUSTOM: luTarget,
} as const

const filterOptions: { value: RoutineTypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'GENERAL', label: 'Generales' },
  { value: 'CUSTOM', label: 'Personalizadas' },
]

const assignmentStatus = (status: RoutineAssignmentStatus) => (
  <span className={`routineFeature__status ${assignmentStatusClassName[status]}`}>
    <span aria-hidden="true" />
    {routineAssignmentStatusLabels[status]}
  </span>
)

const formatPrice = (price: number | null) =>
  price === null ? 'Sin costo' : priceFormatter.format(price)

const routineCard = (routine: Routine) => {
  const Icon = typeIcons[routine.type]
  return (
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
      <div className="routineFeature__cardTop">
        <span className="routineFeature__routineIcon" aria-hidden="true">
          <componentComponents.icon icon={Icon} size="md" />
        </span>
        <span className="routineFeature__typeTag" data-type={routine.type}>
          {routineTypeLabels[routine.type]}
        </span>
      </div>

      <div className="routineFeature__routineBody">
        <h3 className="routineFeature__routineName">{routine.name}</h3>
        <p className="routineFeature__routineTrainer">
          <componentComponents.icon icon={luUserRound} size="sm" />
          {routine.trainerName || 'Sin entrenador asociado'}
        </p>
        <p className="routineFeature__routineDescription">
          {routine.description || 'Sin descripción registrada.'}
        </p>
      </div>

      <footer className="routineFeature__routineFooter">
        <span className="routineFeature__priceBlock">
          <span className="routineFeature__priceLabel">Costo</span>
          <span className="routineFeature__routinePrice">{formatPrice(routine.price)}</span>
        </span>
        <span className="routineFeature__cardAction">
          Ver ficha
          <componentComponents.icon icon={luArrowUpRight} size="sm" />
        </span>
      </footer>
    </Link>
  )
}

const assignmentCard = (assignment: RoutineAssignment) => (
  <Link
    to={`/routines/${assignment.routineId}`}
    viewTransition
    className="routineFeature__assignmentCard"
    aria-label={`Ver ficha de ${assignment.routineName || 'la rutina'}`}
  >
    <span className="routineFeature__assignmentIcon" aria-hidden="true">
      <componentComponents.icon icon={luDumbbell} size="md" />
    </span>
    <span className="routineFeature__assignmentBody">
      <span className="routineFeature__assignmentTop">
        <span className="routineFeature__assignmentName">
          {assignment.routineName || 'Rutina sin nombre'}
        </span>
        {assignmentStatus(assignment.status)}
      </span>
      <span className="routineFeature__assignmentDate">
        Asignada el {dateFormatter.format(new Date(`${assignment.assignmentDate}T00:00:00`))}
      </span>
    </span>
    <componentComponents.icon
      icon={luChevronRight}
      size="sm"
      className="routineFeature__assignmentChevron"
    />
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
    const header = (
      <componentComponents.pageHead
        title="Mis rutinas"
        lede="Consulta las rutinas asignadas a tu perfil."
      />
    )

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
              <div className="routineFeature__clientHead">
                <h2 className="routineFeature__sectionTitle">Asignadas</h2>
                <p className="routineFeature__clientMeta">
                  {assignments.totalElements}{' '}
                  {assignments.totalElements === 1 ? 'rutina' : 'rutinas'} en tu perfil
                </p>
              </div>
              <ul className="routineFeature__assignmentGrid" role="list">
                {assignments.content.map((assignment) => (
                  <li key={assignment.id}>{assignmentCard(assignment)}</li>
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
  const totalCatalog =
    catalog.counts.GENERAL !== null && catalog.counts.CUSTOM !== null
      ? catalog.counts.GENERAL + catalog.counts.CUSTOM
      : (data?.totalElements ?? null)
  const filterCounts: Record<RoutineTypeFilter, number | null> = {
    ALL: totalCatalog,
    GENERAL: catalog.counts.GENERAL,
    CUSTOM: catalog.counts.CUSTOM,
  }
  const pricedRoutines = pageRoutines.filter(
    (routine): routine is Routine & { price: number } => routine.price !== null,
  )
  const lowestPrice = pricedRoutines.length
    ? Math.min(...pricedRoutines.map((routine) => routine.price))
    : null
  const highestPrice = pricedRoutines.length
    ? Math.max(...pricedRoutines.map((routine) => routine.price))
    : null
  const searchHint = catalog.search.trim() ? 'con la búsqueda actual' : 'en el catálogo'

  return (
    <>
      {header}

      <div className="routineFeature__stats">
        <article className="routineFeature__stat">
          <span className="routineFeature__statIcon" aria-hidden="true">
            <componentComponents.icon icon={luDumbbell} size="md" />
          </span>
          <div>
            <p className="routineFeature__statLabel">Rutinas</p>
            <p className="routineFeature__statValue">{totalCatalog ?? '—'}</p>
            <p className="routineFeature__statHint">{searchHint}</p>
          </div>
        </article>
        <article className="routineFeature__stat">
          <span className="routineFeature__statIcon" aria-hidden="true">
            <componentComponents.icon icon={luBookOpen} size="md" />
          </span>
          <div>
            <p className="routineFeature__statLabel">Generales</p>
            <p className="routineFeature__statValue">{catalog.counts.GENERAL ?? '—'}</p>
            <p className="routineFeature__statHint">programas abiertos</p>
          </div>
        </article>
        <article className="routineFeature__stat">
          <span className="routineFeature__statIcon" aria-hidden="true">
            <componentComponents.icon icon={luTarget} size="md" />
          </span>
          <div>
            <p className="routineFeature__statLabel">Personalizadas</p>
            <p className="routineFeature__statValue">{catalog.counts.CUSTOM ?? '—'}</p>
            <p className="routineFeature__statHint">planes a medida</p>
          </div>
        </article>
      </div>

      <div className="routineFeature__filters">
        <componentComponents.searchInput
          id="routine-search"
          aria-label="Buscar rutinas por nombre o descripción"
          autoComplete="off"
          value={catalog.search}
          onChange={(event) => catalog.setSearch(event.currentTarget.value)}
          placeholder="Nombre o descripción"
          className="routineFeature__search"
        />

        <div className="routineFeature__tabs" role="group" aria-label="Filtrar rutinas por tipo">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="routineFeature__tab"
              aria-pressed={catalog.type === option.value}
              onClick={() => catalog.setType(option.value)}
            >
              {option.label}
              {filterCounts[option.value] !== null && (
                <span className="routineFeature__tabCount">{filterCounts[option.value]}</span>
              )}
            </button>
          ))}
        </div>

        <p aria-live="polite" className="routineFeature__resultMeta">
          {catalog.routinesQuery.isFetching
            ? 'Actualizando…'
            : `${data?.totalElements ?? 0} ${data?.totalElements === 1 ? 'rutina' : 'rutinas'}`}
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
              <h2 className="routineFeature__summaryTitle">Tipos de rutina</h2>
              <div className="routineFeature__typeList">
                <div className="routineFeature__typeRow">
                  <span className="routineFeature__typeIcon" data-type="GENERAL" aria-hidden="true">
                    <componentComponents.icon icon={luBookOpen} size="sm" />
                  </span>
                  <div className="routineFeature__typeBody">
                    <p className="routineFeature__typeName">General</p>
                    <p className="routineFeature__typeHint">Plantilla del gimnasio para cualquier socio.</p>
                  </div>
                  <span className="routineFeature__typeCount">{catalog.counts.GENERAL ?? '—'}</span>
                </div>
                <div className="routineFeature__typeRow">
                  <span className="routineFeature__typeIcon" data-type="CUSTOM" aria-hidden="true">
                    <componentComponents.icon icon={luTarget} size="sm" />
                  </span>
                  <div className="routineFeature__typeBody">
                    <p className="routineFeature__typeName">Personalizada</p>
                    <p className="routineFeature__typeHint">Plan adaptado por un entrenador.</p>
                  </div>
                  <span className="routineFeature__typeCount">{catalog.counts.CUSTOM ?? '—'}</span>
                </div>
              </div>
              <p className="routineFeature__asideHint">
                Abre una ficha para revisar el detalle y asignarla a un cliente.
              </p>
            </section>

            <section className="routineFeature__summaryCard">
              <h2 className="routineFeature__summaryTitle">Precios</h2>
              <p className="routineFeature__summaryMeta">En esta página</p>
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

            <section className="routineFeature__summaryCard">
              <h2 className="routineFeature__summaryTitle">En esta página</h2>
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
