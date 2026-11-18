/* oxlint-disable react/rules-of-hooks */
import { Link } from 'react-router'
import {
  LuArrowUpRight as luArrowUpRight,
  LuFilePlus2 as luFilePlus2,
  LuUsers as luUsers,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import './clientFeature.css'
import { useClientDirectory } from '../hooks/useClientDirectory'
import { clientStatusLabel, type ClientResponse } from '../model/clientTypes'

const clientName = (client: ClientResponse): string => `${client.firstName} ${client.lastName}`
const clientInitials = (client: ClientResponse): string =>
  `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase()

const clientStatusTone = (status: string): string => {
  if (status === 'ACTIVE') return 'ok'
  if (status === 'DISABLED') return 'off'
  return 'neutral'
}

const clientStatus = ({ status }: ClientResponse) => (
  <span className="clientFeature__statusChip" data-tone={clientStatusTone(status)}>
    <span aria-hidden="true" className="clientFeature__statusDot" />
    {clientStatusLabel(status)}
  </span>
)

const clientActions = (client: ClientResponse) => (
  <div className="flex flex-wrap items-center gap-2">
    <Link
      to={`/clients/${client.id}`}
      className="clientFeature__actionLink clientFeature__actionLink--primary"
    >
      Ver ficha <componentComponents.icon icon={luArrowUpRight} size="sm" />
    </Link>
    <Link
      to={`/clients/${client.id}#payments`}
      className="clientFeature__actionLink clientFeature__actionLink--quiet"
    >
      Pagos
    </Link>
  </div>
)

const clientCard = (client: ClientResponse) => (
  <li
    key={client.id}
    className="clientFeature__card clientFeature__clientCard gap-4"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="clientFeature__clientHeading min-w-0">
        <span
          className="clientFeature__clientAvatar"
          aria-hidden="true"
        >
          <componentComponents.avatar size="md">{clientInitials(client)}</componentComponents.avatar>
        </span>
        <div className="min-w-0">
          <p className="break-words text-[15px] font-medium">{clientName(client)}</p>
          <p className="mt-1 break-all text-[12.5px] text-muted">{client.email}</p>
        </div>
      </div>
      {clientStatus(client)}
    </div>
    {client.fitnessGoal && (
      <span className="clientFeature__goalChip w-fit">{client.fitnessGoal}</span>
    )}
    <dl className="clientFeature__dataGrid text-[12.5px]">
      <div className="clientFeature__dataItem">
        <dt className="text-faint">Documento</dt>
        <dd className="mt-1 break-words text-ink">{client.documentNumber}</dd>
      </div>
      <div className="clientFeature__dataItem">
        <dt className="text-faint">Teléfono</dt>
        <dd className="mt-1 break-words text-ink">{client.phone || '—'}</dd>
      </div>
    </dl>
    <div className="mt-auto border-t border-line pt-3">{clientActions(client)}</div>
  </li>
)

export const clientsPage = () => {
  const { search, setSearch, page, setPage, pageSize, clientsQuery } = useClientDirectory()
  const data = clientsQuery.data
  const header = (
    <componentComponents.pageHead
      title="Clientes"
      lede="Gestiona perfiles, membresías y pagos."
      actions={
        <Link
          to="/clients/new"
          className={componentComponents.buttonClassName('primary', 'sm')}
        >
          <componentComponents.icon icon={luFilePlus2} size="sm" />
          Nuevo cliente
        </Link>
      }
    />
  )

  if (clientsQuery.isPending) {
    return (
      <>
        {header}
        <section className="clientFeature__card">
          <p className="py-12 text-center text-sm text-muted">Cargando clientes…</p>
        </section>
      </>
    )
  }

  if (clientsQuery.isError || !data) {
    return (
      <>
        {header}
        <section className="clientFeature__card">
          <componentComponents.emptyState
            icon={luUsers}
            title="No se pudo cargar el directorio"
            description="Comprueba tu conexión y vuelve a intentarlo."
            action={
              <componentComponents.button
                variant="default"
                className="clientFeature__button"
                onClick={() => void clientsQuery.refetch()}
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
      <div className="mb-5 flex flex-col gap-3 min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-between">
        <div className="w-full min-[640px]:max-w-[360px]">
          <componentComponents.searchInput
            id="client-search"
            aria-label="Buscar clientes por nombre, correo o documento"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Nombre, correo o documento"
          />
        </div>
        <p aria-live="polite" className="text-xs text-faint min-[640px]:ml-auto">
          {clientsQuery.isFetching ? 'Actualizando…' : `${data.totalElements} clientes`}
        </p>
      </div>

      {data.content.length === 0 ? (
        <section className="clientFeature__card">
          <componentComponents.emptyState
            icon={luUsers}
            title={search.trim() ? 'No encontramos coincidencias' : 'Aún no hay clientes'}
            description={
              search.trim()
                ? 'Prueba con otro nombre, correo o documento.'
                : 'Cuando registres un cliente, aparecerá en este directorio.'
            }
            action={
              !search.trim() && (
                <Link
                  to="/clients/new"
                  className="clientFeature__actionLink clientFeature__actionLink--primary"
                >
                  <componentComponents.icon icon={luFilePlus2} size="sm" />
                  Registrar cliente
                </Link>
              )
            }
          />
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.content.map(clientCard)}
        </ul>
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
    </>
  )
}
