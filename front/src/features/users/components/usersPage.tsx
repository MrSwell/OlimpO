/* oxlint-disable react/rules-of-hooks */
import { useState } from 'react'
import {
  LuLock as luLock,
  LuPencil as luPencil,
  LuUserPlus as luUserPlus,
  LuUsers as luUsers,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useUserDirectory } from '../hooks/useUserDirectory'
import {
  staffRoleLabels,
  userStatusLabels,
  type UserResponse,
  type UserStatus,
} from '../model/userTypes'
import * as userFormDialogComponents from './userFormDialog'
import * as userRolesDialogComponents from './userRolesDialog'
import './userFeature.css'

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const userInitials = (user: UserResponse) =>
  `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

const roleLabel = (role: UserResponse['roles'][number]) => {
  if (role === 'CLIENT') return 'Cliente'
  return staffRoleLabels[role]
}

const statusTone: Record<UserStatus, string> = {
  ACTIVE: 'ok',
  INACTIVE: 'off',
}

const userStatus = ({ status }: UserResponse) => (
  <span className="userFeature__statusChip" data-tone={statusTone[status]}>
    <span aria-hidden="true" className="userFeature__statusDot" />
    {userStatusLabels[status]}
  </span>
)

export const usersPage = () => {
  const { search, setSearch, page, setPage, pageSize, usersQuery } = useUserDirectory()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const data = usersQuery.data

  const header = (
    <componentComponents.pageHead
      title="Usuarios"
      lede="Administra las cuentas del personal, sus roles y su acceso al sistema."
      actions={
        <componentComponents.button
          variant="primary"
          size="sm"
          icon={luUserPlus}
          onClick={() => setIsCreateOpen(true)}
        >
          Nuevo usuario
        </componentComponents.button>
      }
    />
  )

  if (usersQuery.isPending) {
    return (
      <>
        {header}
        <section className="userFeature__panel">
          <p className="py-12 text-center text-sm text-muted">Cargando usuarios…</p>
        </section>
      </>
    )
  }

  if (usersQuery.isError || !data) {
    return (
      <>
        {header}
        <section className="userFeature__panel">
          <componentComponents.emptyState
            icon={luUsers}
            title="No se pudo cargar la lista de usuarios"
            description="Comprueba tu conexión y vuelve a intentarlo."
            action={
              <componentComponents.button
                variant="default"
                onClick={() => void usersQuery.refetch()}
              >
                Reintentar
              </componentComponents.button>
            }
          />
        </section>
      </>
    )
  }

  const activeOnPage = data.content.filter((user) => user.status === 'ACTIVE').length

  return (
    <>
      {header}

      <div className="userFeature__stats">
        <article className="userFeature__stat">
          <span className="userFeature__statIcon" aria-hidden="true">
            <componentComponents.icon icon={luUsers} size="md" />
          </span>
          <div>
            <p className="userFeature__statLabel">Cuentas</p>
            <p className="userFeature__statValue">{data.totalElements}</p>
            <p className="userFeature__statHint">registradas en el sistema</p>
          </div>
        </article>
        <article className="userFeature__stat">
          <span className="userFeature__statIcon" aria-hidden="true">
            <componentComponents.icon icon={luUserPlus} size="md" />
          </span>
          <div>
            <p className="userFeature__statLabel">Activas</p>
            <p className="userFeature__statValue">{activeOnPage}</p>
            <p className="userFeature__statHint">en esta página</p>
          </div>
        </article>
      </div>

      <section className="userFeature__panel" aria-labelledby="users-list-heading">
        <div className="userFeature__toolbar">
          <div className="userFeature__search">
            <componentComponents.searchInput
              id="user-search"
              aria-label="Buscar usuarios por nombre o correo"
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Nombre o correo"
            />
          </div>
          <h2 id="users-list-heading" className="userFeature__listTitle">
            Personal
          </h2>
          <p aria-live="polite" className="userFeature__resultMeta">
            {usersQuery.isFetching
              ? 'Actualizando…'
              : `${data.totalElements} ${data.totalElements === 1 ? 'cuenta' : 'cuentas'}`}
          </p>
        </div>

        {data.content.length === 0 ? (
          <componentComponents.emptyState
            icon={luUsers}
            title={search.trim() ? 'No encontramos coincidencias' : 'Aún no hay usuarios'}
            description={
              search.trim()
                ? 'Prueba con otro nombre o correo.'
                : 'Crea la primera cuenta de personal para dar acceso al sistema.'
            }
            action={
              !search.trim() ? (
                <componentComponents.button
                  variant="default"
                  icon={luUserPlus}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Crear usuario
                </componentComponents.button>
              ) : undefined
            }
          />
        ) : (
          <ul className="userFeature__list" role="list">
            {data.content.map((user) => {
              const isClient = user.roles.includes('CLIENT')
              return (
                <li key={user.id} className="userFeature__row">
                  <div className="userFeature__identity">
                    <componentComponents.avatar size="sm">
                      {userInitials(user)}
                    </componentComponents.avatar>
                    <div className="userFeature__identityBody">
                      <p className="userFeature__name">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="userFeature__email">{user.email}</p>
                      <p className="userFeature__meta">
                        {user.phone || 'Sin celular'}
                        <span aria-hidden="true"> · </span>
                        Alta {dateFormatter.format(new Date(user.createdAt))}
                      </p>
                    </div>
                  </div>

                  <div className="userFeature__roles" aria-label="Roles">
                    {user.roles.map((role) => (
                      <span key={role} className="userFeature__roleChip" data-role={role}>
                        {roleLabel(role)}
                      </span>
                    ))}
                  </div>

                  {userStatus(user)}

                  <div className="userFeature__rowAction">
                    {isClient ? (
                      <span className="userFeature__locked">
                        <componentComponents.icon icon={luLock} size="sm" />
                        Se gestiona en Clientes
                      </span>
                    ) : (
                      <componentComponents.iconButton
                        icon={luPencil}
                        label={`Editar roles de ${user.firstName} ${user.lastName}`}
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {data.totalPages > 1 && (
        <componentComponents.pagination
          page={page + 1}
          pageSize={pageSize}
          totalItems={data.totalElements}
          totalPages={data.totalPages}
          onPageChange={(nextPage) => setPage(nextPage - 1)}
        />
      )}

      <userFormDialogComponents.userFormDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <userRolesDialogComponents.userRolesDialog
        open={editingUser !== null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />
    </>
  )
}
