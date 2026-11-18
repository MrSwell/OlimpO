/* oxlint-disable react/rules-of-hooks */
import { useState } from 'react'
import {
  LuCog as luCog,
  LuPencil as luPencil,
  LuPlus as luPlus,
  LuSearch as luSearch,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { machineStatusLabels, machineStatuses, type Machine } from '../model/machineTypes'
import type { MachineStatusFilter } from '../model/machineTypes'
import * as machineFormDialogComponents from './machineFormDialog'
import { useMachinesDirectory } from '../hooks/useMachinesDirectory'
import './machineFeature.css'

const statusFilterOptions: Array<{ value: MachineStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todos los estados' },
  ...machineStatuses.map((status) => ({ value: status, label: machineStatusLabels[status] })),
]

const machineStatusDotClass: Record<Machine['status'], string> = {
  AVAILABLE: 'machineFeature__statusDot--available',
  MAINTENANCE: 'machineFeature__statusDot--maintenance',
  OUT_OF_SERVICE: 'machineFeature__statusDot--out',
}

const statusCell = (machine: Machine) => (
  <span className="machineFeature__statusCell text-[12.5px]">
    <span
      aria-hidden="true"
      className={`machineFeature__statusDot ${machineStatusDotClass[machine.status]}`}
    />
    {machineStatusLabels[machine.status]}
  </span>
)

export const machinesPage = () => {
  const { status, setStatus, search, setSearch, debouncedSearch, page, setPage, pageSize, machinesQuery } =
    useMachinesDirectory()
  const [machineToEdit, setMachineToEdit] = useState<Machine | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const data = machinesQuery.data

  const header = (
    <componentComponents.pageHead
      title="Máquinas"
      lede="Estado y serie de cada máquina del gimnasio, con filtros por disponibilidad."
      className="mb-6"
      actions={
        <button
          type="button"
          className="machineFeature__actionLink"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <componentComponents.icon icon={luPlus} size="sm" />
          Nueva máquina
        </button>
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

  return (
    <>
      {header}

      <div className="machineFeature__filters mb-5">
        <componentComponents.field label="Buscar máquinas" htmlFor="machine-search" className="machineFeature__search">
          <componentComponents.input
            id="machine-search"
            icon={luSearch}
            type="search"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Nombre, marca, modelo o serie"
          />
        </componentComponents.field>

        <componentComponents.field
          label="Estado"
          htmlFor="machine-status-filter"
          className="machineFeature__statusFilter"
        >
          <componentComponents.select
            id="machine-status-filter"
            value={status}
            onChange={(event) => setStatus(event.currentTarget.value as MachineStatusFilter)}
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </componentComponents.select>
        </componentComponents.field>

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
        <section className="machineFeature__card">
          <componentComponents.dataTable<Machine>
            getRowKey={(machine) => machine.id}
            rows={data.content}
            columns={[
              {
                key: 'name',
                header: 'Máquina',
                render: (machine) => (
                  <div className="min-w-0">
                    <p className="break-words text-[13.5px] font-medium text-ink">{machine.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-faint">
                      {[machine.brand, machine.model].filter(Boolean).join(' · ') || 'Sin marca/modelo'}
                    </p>
                  </div>
                ),
              },
              {
                key: 'serial',
                header: 'Serie',
                render: (machine) => (
                  <span className="break-all text-muted">{machine.serialNumber || '—'}</span>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: statusCell,
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (machine) => (
                  <button
                    type="button"
                    className="machineFeature__actionLink"
                    onClick={() => setMachineToEdit(machine)}
                  >
                    <componentComponents.icon icon={luPencil} size="sm" />
                    Editar
                  </button>
                ),
              },
            ]}
          />
        </section>
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
    </>
  )
}
