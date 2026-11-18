/* oxlint-disable react/rules-of-hooks */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  LuArrowLeft as luArrowLeft,
  LuArrowUpRight as luArrowUpRight,
  LuCreditCard as luCreditCard,
  LuFingerprint as luFingerprint,
  LuMail as luMail,
  LuTarget as luTarget,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { useClientProfile } from '../hooks/useClientProfile'
import { formatDate, formatMoney } from '../model/clientFormatting'
import {
  clientStatusLabel,
  membershipStatusLabels,
  membershipTypeLabels,
  type MembershipResponse,
} from '../model/clientTypes'
import * as membershipActionDialogComponents from './membershipActionDialog'
import * as membershipProgressComponents from './membershipProgress'
import * as paymentHistoryComponents from '@/features/payments/components/paymentHistory'
import './clientFeature.css'

const membershipStatus = (status: MembershipResponse['status']) => (
  <span className="inline-flex items-center gap-2 text-[12.5px] text-muted">
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-success' : 'bg-faint'}`}
    />
    {membershipStatusLabels[status]}
  </span>
)

const getClientInitials = (firstName: string, lastName: string): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

const clientStatusBadge = (status: string) => (
  <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-muted">
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-success' : 'bg-faint'}`}
    />
    {clientStatusLabel(status)}
  </span>
)

export const clientDetailPage = () => {
  const { clientId: rawClientId } = useParams()
  const profile = useClientProfile(rawClientId)
  const roles = useAuthStore((state) => state.roles)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [membershipToRenew, setMembershipToRenew] = useState<MembershipResponse | null>(null)
  const client = profile.clientQuery.data
  const activeMembership = profile.activeMembershipQuery.data
  const canManageMemberships = roles.some(
    (role) => role === 'ADMIN' || role === 'RECEPCIONIST',
  )

  useEffect(() => {
    if (client && window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
    }
  }, [client])

  const openCreateMembership = () => {
    setMembershipToRenew(null)
    setDialogOpen(true)
  }

  const openRenewal = (membership: MembershipResponse) => {
    setMembershipToRenew(membership)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setMembershipToRenew(null)
  }

  if (!profile.hasValidClientId) {
    return (
      <>
        <componentComponents.pageHead title="Ficha del cliente" />
        <section className="clientFeature__card">
          <componentComponents.emptyState
            title="Identificador no válido"
            description="La dirección no contiene un identificador de cliente válido."
          />
        </section>
      </>
    )
  }

  if (profile.clientQuery.isPending) {
    return (
      <>
        <componentComponents.pageHead title="Ficha del cliente" />
        <section className="clientFeature__card">
          <p className="py-10 text-center text-sm text-muted">Cargando ficha…</p>
        </section>
      </>
    )
  }

  if (profile.clientQuery.isError || !client) {
    return (
      <>
        <componentComponents.pageHead title="Ficha del cliente" />
        <section className="clientFeature__card">
          <componentComponents.emptyState
            title="No se pudo cargar la ficha"
            description="El cliente puede no existir o tu cuenta no tener permiso para consultarlo."
            action={
              <componentComponents.button
                className="clientFeature__button"
                onClick={() => void profile.clientQuery.refetch()}
                variant="default"
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
      <componentComponents.pageHead
        title="Ficha del cliente"
       
        actions={
          <Link to="/clients" className="clientFeature__actionLink">
            <componentComponents.icon icon={luArrowLeft} size="sm" />
            Directorio
          </Link>
        }
      />

      <div className="clientFeature__dashboardGrid">
        <section
          className="clientFeature__card clientFeature__dashboardProfileCard"
          aria-labelledby="client-profile-title"
        >
          <div className="clientFeature__profileHeader">
            <div className="clientFeature__profileIdentity">
              <span
                className="clientFeature__clientAvatar"
                aria-hidden="true"
              >
                <componentComponents.avatar size="lg">
                  {getClientInitials(client.firstName, client.lastName)}
                </componentComponents.avatar>
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 id="client-profile-title" className="break-words text-xl font-semibold">
                    {client.firstName} {client.lastName}
                  </h2>
                  {clientStatusBadge(client.status)}
                </div>
                <p className="mt-1.5 break-all text-[13px] text-muted">{client.email}</p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="clientFeature__card clientFeature__membershipCard clientFeature__dashboardMembershipCard"
          id="memberships"
          aria-labelledby="membership-current-title"
        >
          <div className="clientFeature__sectionHeading">
            <h2
              id="membership-current-title"
              className="inline-flex items-center gap-2 text-[17px] font-semibold"
            >
              <componentComponents.icon icon={luCreditCard} size="md" className="text-muted" />
              Membresía vigente
            </h2>
            {canManageMemberships && profile.activeMembershipQuery.isSuccess && (
              activeMembership ? (
                <componentComponents.button
                  variant="default"
                  size="sm"
                  className="clientFeature__button"
                  onClick={() => openRenewal(activeMembership)}
                >
                  Renovar
                </componentComponents.button>
              ) : (
                <componentComponents.button
                  variant="default"
                  size="sm"
                  className="clientFeature__button"
                  onClick={openCreateMembership}
                >
                  Activar
                </componentComponents.button>
              )
            )}
          </div>

          {profile.activeMembershipQuery.isPending ? (
            <p className="py-5 text-sm text-muted">Consultando membresía vigente…</p>
          ) : profile.activeMembershipQuery.isError ? (
            <div className="pt-4">
              <p className="text-[13px] text-muted">No se pudo consultar la membresía vigente.</p>
              <componentComponents.button
                variant="default"
                size="sm"
                className="clientFeature__button mt-3"
                onClick={() => void profile.activeMembershipQuery.refetch()}
              >
                Reintentar
              </componentComponents.button>
            </div>
          ) : activeMembership ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-xs text-faint">Plan activo</p>
                  <p className="mt-1 text-lg font-medium">
                    {membershipTypeLabels[activeMembership.type]}
                  </p>
                </div>
                <div className="text-left min-[520px]:text-right">
                  <p className="text-xs text-faint">Precio</p>
                  <p className="mt-1 text-[15px] font-medium">
                    {formatMoney(activeMembership.price)}
                  </p>
                </div>
              </div>
              <membershipProgressComponents.membershipProgress membership={activeMembership} />
            </>
          ) : (
            <p className="pt-3 text-[13px] text-muted">
              No hay una suscripción vigente para este cliente.
            </p>
          )}
        </section>

        <article
          className="clientFeature__card clientFeature__dashboardDataCard"
          aria-labelledby="client-contact-title"
        >
          <h2 id="client-contact-title" className="inline-flex items-center gap-2 text-[15px] font-semibold">
            <componentComponents.icon icon={luMail} size="sm" className="text-muted" />
            Contacto
          </h2>
          <dl className="mt-4 grid gap-4 text-[13px]">
            <div>
              <dt className="text-xs text-faint">Correo</dt>
              <dd className="mt-1 break-all">{client.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Teléfono</dt>
              <dd className="mt-1">{client.phone || 'No registrado'}</dd>
            </div>
          </dl>
        </article>

        <article
          className="clientFeature__card clientFeature__dashboardDataCard"
          aria-labelledby="client-identity-title"
        >
          <h2 id="client-identity-title" className="inline-flex items-center gap-2 text-[15px] font-semibold">
            <componentComponents.icon icon={luFingerprint} size="sm" className="text-muted" />
            Identificación
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <dt className="text-xs text-faint">Documento</dt>
              <dd className="mt-1 break-words">{client.documentNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Nacimiento</dt>
              <dd className="mt-1">{formatDate(client.birthDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Sexo</dt>
              <dd className="mt-1">
                {client.sex === 'F' ? 'Femenino' : client.sex === 'M' ? 'Masculino' : '—'}
              </dd>
            </div>
          </dl>
        </article>

        <article
          className="clientFeature__card clientFeature__dashboardGoalCard"
          aria-labelledby="client-goal-title"
        >
          <h2 id="client-goal-title" className="inline-flex items-center gap-2 text-[15px] font-semibold">
            <componentComponents.icon icon={luTarget} size="sm" className="text-muted" />
            Objetivo de entrenamiento
          </h2>
          <p className="mt-3 text-[13px] text-muted">
            {client.fitnessGoal || 'No se ha registrado un objetivo.'}
          </p>
        </article>

        <section
          className="clientFeature__card clientFeature__dashboardActivityCard"
          id="membership-history"
          aria-labelledby="membership-history-title"
        >
          <h2 id="membership-history-title" className="text-[15px] font-semibold">
            Historial de membresías
          </h2>
          {profile.membershipsQuery.isPending ? (
            <p className="py-5 text-sm text-muted">Cargando historial…</p>
          ) : profile.membershipsQuery.isError ? (
            <componentComponents.emptyState
              title="No se pudo cargar el historial"
              description="Vuelve a intentarlo."
              action={
                <componentComponents.button
                  variant="quiet"
                  size="sm"
                  className="clientFeature__button"
                  onClick={() => void profile.membershipsQuery.refetch()}
                >
                  Reintentar
                </componentComponents.button>
              }
            />
          ) : profile.membershipsQuery.data.content.length === 0 ? (
            <p className="py-5 text-[13px] text-muted">Todavía no hay membresías registradas.</p>
          ) : (
            <>
              <ul className="clientFeature__historyList mt-2">
                {profile.membershipsQuery.data.content.map((membership) => (
                  <li key={membership.id} className="clientFeature__historyItem py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{membershipTypeLabels[membership.type]}</p>
                        <p className="mt-1 text-[12.5px] text-muted">
                          {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
                        </p>
                      </div>
                      {membershipStatus(membership.status)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
                      <span className="text-muted">{formatMoney(membership.price)}</span>
                      {canManageMemberships && membership.status === 'ACTIVE' && (
                        <componentComponents.button
                          variant="default"
                          size="sm"
                          className="clientFeature__button"
                          onClick={() => openRenewal(membership)}
                        >
                          Renovar
                        </componentComponents.button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {profile.membershipsQuery.data.totalPages > 1 && (
                <componentComponents.pagination
                  page={profile.membershipPage + 1}
                  pageSize={profile.historyPageSize}
                  totalItems={profile.membershipsQuery.data.totalElements}
                  totalPages={profile.membershipsQuery.data.totalPages}
                  onPageChange={(nextPage) => profile.setMembershipPage(nextPage - 1)}
                />
              )}
            </>
          )}
        </section>

        <section
          className="clientFeature__card clientFeature__dashboardActivityCard"
          id="payments"
          aria-labelledby="client-payments-title"
        >
          <div className="clientFeature__sectionHeading">
            <h2 id="client-payments-title" className="text-[15px] font-semibold">
              Pagos
            </h2>
            {canManageMemberships && (
              <Link
                to={`/payments?clientId=${client.id}`}
                className="clientFeature__actionLink"
              >
                Registrar pago
                <componentComponents.icon icon={luArrowUpRight} size="sm" />
              </Link>
            )}
          </div>
          <paymentHistoryComponents.paymentHistory
            data={profile.paymentsQuery.data}
            isPending={profile.paymentsQuery.isPending}
            isError={profile.paymentsQuery.isError}
            page={profile.paymentPage}
            pageSize={profile.historyPageSize}
            onPageChange={profile.setPaymentPage}
            onRetry={() => void profile.paymentsQuery.refetch()}
          />
        </section>
      </div>

      {canManageMemberships && (
        <membershipActionDialogComponents.membershipActionDialog
          open={dialogOpen}
          clientId={profile.clientId}
          membership={membershipToRenew}
          onClose={closeDialog}
        />
      )}
    </>
  )
}
