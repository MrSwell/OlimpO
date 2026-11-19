/* oxlint-disable react/rules-of-hooks */
import { Link } from 'react-router'
import {
  LuChevronRight as luChevronRight,
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
                  className={componentComponents.buttonClassName('primary', 'sm')}
                >
                  <componentComponents.icon icon={luFilePlus2} size="sm" />
                  Registrar cliente
                </Link>
              )
            }
          />
        </section>
      ) : (
        <ul className="clientFeature__clientList" role="list">
          {data.content.map((client) => (
            <li key={client.id} className="clientFeature__clientListItem">
              <Link
                to={`/clients/${client.id}`}
                viewTransition
                state={{ client }}
                className="clientFeature__clientRow"
              >
                <span
                  className="clientFeature__clientAvatar"
                  aria-hidden="true"
                  style={{ viewTransitionName: `client-avatar-${client.id}` }}
                >
                  <componentComponents.avatar size="sm">
                    {clientInitials(client)}
                  </componentComponents.avatar>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-[15px]">
                    {clientName(client)}
                  </p>
                  <p className="clientFeature__clientMeta">
                    <span>Doc. {client.documentNumber}</span>
                    <span aria-hidden="true" className="clientFeature__clientMetaDot">·</span>
                    <span>{client.phone || 'Sin celular'}</span>
                    <span aria-hidden="true" className="clientFeature__clientMetaDot">·</span>
                    <span className="truncate">{client.email}</span>
                  </p>
                </div>
                {clientStatus(client)}
                <span className="clientFeature__clientChevron" aria-hidden="true">
                  <componentComponents.icon icon={luChevronRight} size="sm" />
                </span>
              </Link>
            </li>
          ))}
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
