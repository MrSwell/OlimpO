/* oxlint-disable react/rules-of-hooks */
import { useState, type FormEvent } from 'react'
import { LuUserRoundPlus as luUserRoundPlus } from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useClientLookup } from '@/features/clients/hooks/useClientLookup'
import {
  routineAssignmentStatusLabels,
  routineAssignmentStatusSchema,
  type RoutineAssignmentStatus,
} from '../model/routineTypes'
import { useRoutineAssignment } from '../hooks/useRoutineAssignment'
import './routineFeature.css'

interface RoutineAssignmentDialogProps {
  open: boolean
  routineId: number
  routineName: string
  onClose: () => void
}

const assignmentStatuses: RoutineAssignmentStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED']

export const routineAssignmentDialog = ({
  open,
  routineId,
  routineName,
  onClose,
}: RoutineAssignmentDialogProps) => {
  const [search, setSearch] = useState('')
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState<RoutineAssignmentStatus>('ACTIVE')
  const clientsQuery = useClientLookup(search.trim(), open)
  const assignmentMutation = useRoutineAssignment(routineId, onClose)
  const clients = clientsQuery.data?.content ?? []

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!clientId) return
    assignmentMutation.mutate({ clientId: Number(clientId), status })
  }

  return (
    <componentComponents.modal
      open={open}
      onClose={onClose}
      title="Asignar rutina"
      icon={luUserRoundPlus}
      footer={
        <>
          <componentComponents.button
            variant="quiet"
            size="sm"
            onClick={onClose}
            disabled={assignmentMutation.isPending}
          >
            Cancelar
          </componentComponents.button>
          <componentComponents.button
            type="submit"
            form="routine-assignment-form"
            variant="primary"
            size="sm"
            disabled={assignmentMutation.isPending || !clientId}
          >
            {assignmentMutation.isPending ? 'Asignando…' : 'Asignar'}
          </componentComponents.button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-muted">
        Asigna <strong className="font-medium text-ink">{routineName}</strong> a un cliente y registra su estado.
      </p>

      <form id="routine-assignment-form" onSubmit={submit} className="grid gap-4">
        <componentComponents.field label="Buscar cliente" htmlFor="routine-client-search">
          <componentComponents.searchInput
            id="routine-client-search"
            aria-label="Buscar clientes por nombre"
            autoComplete="off"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value)
              setClientId('')
            }}
            placeholder="Nombre del cliente"
          />
        </componentComponents.field>

        <componentComponents.field label="Cliente" htmlFor="routine-client">
          <componentComponents.select
            id="routine-client"
            required
            value={clientId}
            onChange={(event) => setClientId(event.currentTarget.value)}
            disabled={clientsQuery.isPending || clientsQuery.isError}
          >
            <option value="">
              {clientsQuery.isPending ? 'Cargando clientes…' : 'Selecciona un cliente'}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </componentComponents.select>
          {clientsQuery.isError && (
            <p className="text-xs text-danger" role="alert">
              No se pudo cargar el directorio de clientes.
              <button
                type="button"
                className="ml-1 underline underline-offset-2"
                onClick={() => void clientsQuery.refetch()}
              >
                Reintentar
              </button>
            </p>
          )}
          {!clientsQuery.isPending && !clientsQuery.isError && clients.length === 0 && (
            <p className="text-xs text-muted">No hay clientes que coincidan con la búsqueda.</p>
          )}
        </componentComponents.field>

        <componentComponents.field label="Estado inicial" htmlFor="routine-assignment-status">
          <componentComponents.select
            id="routine-assignment-status"
            value={status}
              onChange={(event) =>
                setStatus(routineAssignmentStatusSchema.parse(event.currentTarget.value))
              }
          >
            {assignmentStatuses.map((nextStatus) => (
              <option key={nextStatus} value={nextStatus}>
                {routineAssignmentStatusLabels[nextStatus]}
              </option>
            ))}
          </componentComponents.select>
        </componentComponents.field>
      </form>
    </componentComponents.modal>
  )
}
