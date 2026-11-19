/* oxlint-disable react/rules-of-hooks */
import { useState } from 'react'
import {
  LuCog as luCog,
  LuPencil as luPencil,
  LuPlus as luPlus,
  LuTrash2 as luTrash2,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { machineStatusLabels, machineStatuses, type Machine } from '../model/machineTypes'
import type { MachineStatusFilter } from '../model/machineTypes'
import * as machineFormDialogComponents from './machineFormDialog'
import { useMachinesDirectory } from '../hooks/useMachinesDirectory'
import { useDeleteMachine } from '../hooks/useDeleteMachine'
import './machineFeature.css'

const statusFilterOptions: Array<{ value: MachineStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todos los estados' },
  ...machineStatuses.map((status) => ({ value: status, label: machineStatusLabels[status] })),
]

const machineStatusTone: Record<Machine['status'], string> = {
  AVAILABLE: 'available',
  MAINTENANCE: 'maintenance',
  OUT_OF_SERVICE: 'out',
}

const machineStatus = (machine: Machine) => (
  <span className="machineFeature__statusChip" data-tone={machineStatusTone[machine.status]}>
    <span aria-hidden="true" className="machineFeature__statusDot" />
    {machineStatusLabels[machine.status]}
  </span>
)

const machineCard = (
  machine: Machine,
  onEdit: (machine: Machine) => void,
  onDelete: (machine: Machine) => void,
) => (
  <article className="machineFeature__machineCard">
    <div className="machineFeature__machineHeader">
      <span className="machineFeature__machineIcon" aria-hidden="true">
        <componentComponents.icon icon={luCog} size="md" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-[15.5px] font-semibold leading-snug">
          {machine.name}
        </h3>
        <p className="machineFeature__machineMeta">
          {[machine.brand, machine.model].filter(Boolean).join(' · ') ||
            'Marca y modelo sin registrar'}
        </p>
      </div>
    </div>

    <dl className="machineFeature__machineData">
      <div>
        <dt>Serie</dt>
        <dd className="break-all">{machine.serialNumber || 'No registrada'}</dd>
      </div>
    </dl>

    <footer className="machineFeature__machineFooter">
      {machineStatus(machine)}
      <div className="machineFeature__machineActions">
        <button
          type="button"
          className="machineFeature__itemAction"
          aria-label={`Editar ${machine.name}`}
          onClick={() => onEdit(machine)}
        >
          <componentComponents.icon icon={luPencil} size="sm" />
          Editar
        </button>
        <button
          type="button"
          className="machineFeature__deleteAction"
          aria-label={`Eliminar ${machine.name}`}
          onClick={() => onDelete(machine)}
        >
          <componentComponents.icon icon={luTrash2} size="sm" />
        </button>
      </div>
    </footer>
  </article>
)

export const machinesPage = () => {
  const { status, setStatus, search, setSearch, debouncedSearch, page, setPage, pageSize, machinesQuery } =
    useMachinesDirectory()
  const [machineToEdit, setMachineToEdit] = useState<Machine | null>(null)
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const deleteMachine = useDeleteMachine()
  const data = machinesQuery.data

  const header = (
    <componentComponents.pageHead
      title="Máquinas"
      lede="Estado y serie de cada máquina del gimnasio, con filtros por disponibilidad."
      actions={
        <componentComponents.button
          variant="primary"
          size="sm"
          icon={luPlus}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Nueva máquina
        </componentComponents.button>
      }
    />
  )

  if (machinesQuery.isPending) {
    return (
      <>
        {header}
        <section className="machineFeature__card">
          <p className="py-12 text-center text-sm text-muted">Cargando máquinas…</p>
        </section>
      </>
    )
  }

  if (machinesQuery.isError || !data) {
    return (
      <>
        {header}
        <section className="machineFeature__card">
          <componentComponents.emptyState
            icon={luCog}
            title="No se pudieron cargar las máquinas"
            description="Comprueba tu conexión y vuelve a intentarlo."
            action={
              <componentComponents.button
                variant="default"
                onClick={() => void machinesQuery.refetch()}
              >
                Reintentar
              </componentComponents.button>
            }
          />
        </section>
      </>
    )
  }

  const pageMachines = data.content
  const countByStatus = (nextStatus: Machine['status']): number =>
    pageMachines.filter((machine) => machine.status === nextStatus).length

  return (
    <>
      {header}

      <div className="machineFeature__filters mb-5">
        <componentComponents.searchInput
          id="machine-search"
          aria-label="Buscar máquinas por nombre, marca, modelo o serie"
          autoComplete="off"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Nombre, marca, modelo o serie"
          className="machineFeature__search"
        />

        <componentComponents.select
          id="machine-status-filter"
          aria-label="Filtrar máquinas por estado"
          className="machineFeature__statusFilter"
          value={status}
          onChange={(event) => setStatus(event.currentTarget.value as MachineStatusFilter)}
        >
          {statusFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </componentComponents.select>

        <p aria-live="polite" className="ml-auto text-xs text-faint">
          {machinesQuery.isFetching ? 'Actualizando…' : `${data.totalElements} máquinas`}
        </p>
      </div>

      {data.content.length === 0 ? (
        <section className="machineFeature__card">
          <componentComponents.emptyState
            icon={luCog}
            title={
              search.trim() || debouncedSearch || status !== 'ALL'
                ? 'No encontramos máquinas'
                : 'Aún no hay máquinas'
            }
            description={
              search.trim() || debouncedSearch || status !== 'ALL'
                ? 'Prueba con otro término o cambia el filtro de estado.'
                : 'Cuando registres la primera máquina, aparecerá en este directorio.'
            }
            action={
              !search.trim() &&
              !debouncedSearch &&
              status === 'ALL' && (
                <button
                  type="button"
                  className="machineFeature__actionLink"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <componentComponents.icon icon={luPlus} size="sm" />
                  Registrar máquina
                </button>
              )
            }
          />
        </section>
      ) : (
        <div className="machineFeature__layout">
          <ul className="machineFeature__grid" role="list">
            {pageMachines.map((machine) => (
              <li key={machine.id} className="machineFeature__gridItem">
                {machineCard(machine, setMachineToEdit, setMachineToDelete)}
              </li>
            ))}
          </ul>

          <aside className="machineFeature__aside" aria-label="Resumen de máquinas">
            <section className="machineFeature__summaryCard">
              <h2 className="machineFeature__summaryTitle">Estado en esta página</h2>
              <dl className="machineFeature__summaryList">
                <div>
                  <dt>
                    <span className="machineFeature__summaryDot" data-tone="available" aria-hidden="true" />
                    Disponibles
                  </dt>
                  <dd>{countByStatus('AVAILABLE')}</dd>
                </div>
                <div>
                  <dt>
                    <span className="machineFeature__summaryDot" data-tone="maintenance" aria-hidden="true" />
                    Mantenimiento
                  </dt>
                  <dd>{countByStatus('MAINTENANCE')}</dd>
                </div>
                <div>
                  <dt>
                    <span className="machineFeature__summaryDot" data-tone="out" aria-hidden="true" />
                    Fuera de servicio
                  </dt>
                  <dd>{countByStatus('OUT_OF_SERVICE')}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      )}

      {data.totalPages > 1 && (
        <componentComponents.pagination
          page={page + 1}
          pageSize={pageSize}
          totalItems={data.totalElements}
          totalPages={data.totalPages}
          onPageChange={(nextPage) => setPage(nextPage - 1)}
        />
      )}

      <machineFormDialogComponents.machineFormDialog
        open={isCreateDialogOpen}
        machine={null}
        onClose={() => setIsCreateDialogOpen(false)}
      />
      <machineFormDialogComponents.machineFormDialog
        open={machineToEdit !== null}
        machine={machineToEdit}
        onClose={() => setMachineToEdit(null)}
      />
      <componentComponents.confirmDialog
        open={machineToDelete !== null}
        title="Eliminar máquina"
        description={
          <>
            Se eliminará «{machineToDelete?.name}» del inventario de máquinas. Esta acción no se
            puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        isSubmitting={deleteMachine.isPending}
        onConfirm={() => {
          if (!machineToDelete) return
          deleteMachine.mutate(
            { id: machineToDelete.id, name: machineToDelete.name },
            { onSettled: () => setMachineToDelete(null) },
          )
        }}
        onClose={() => setMachineToDelete(null)}
      />
    </>
  )
}
