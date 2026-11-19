/* oxlint-disable react/rules-of-hooks */
import { useEffect, useState } from 'react'
import * as componentComponents from '@/components'
import { useAuthStore } from '@/stores/authStore'
import { useClientProfile } from '../hooks/useClientProfile'
import { formatDate, formatMoney } from '../model/clientFormatting'
import {
  clientStatusLabel,
  membershipStatusLabels,
  membershipTypeLabels,
  type ClientResponse,
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
  <span className="clientFeature__statusChip" data-tone={status === 'ACTIVE' ? 'ok' : 'neutral'}>
    <span aria-hidden="true" className="clientFeature__statusDot" />
    {clientStatusLabel(status)}
  </span>
)

interface ClientFichaProps {
  clientId: string | undefined
  initialClient?: ClientResponse
  avatarTransitionName?: string
}

/**
 * Full client ficha content (identity, membership, data, history, payments).
 * Rendered by the `/clients/:clientId` route page.
 */
export const clientFicha = ({
  clientId,
  initialClient,
  avatarTransitionName,
}: ClientFichaProps) => {
  const profile = useClientProfile(clientId)
  const roles = useAuthStore((state) => state.roles)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [membershipToRenew, setMembershipToRenew] = useState<MembershipResponse | null>(null)
  const client = profile.clientQuery.data ?? initialClient
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
      <section className="clientFeature__card">
        <componentComponents.emptyState
          title="Identificador no válido"
          description="La dirección no contiene un identificador de cliente válido."
        />
      </section>
    )
  }

  if (profile.clientQuery.isPending && !client) {
    return (
      <section className="clientFeature__card">
        <p className="py-10 text-center text-sm text-muted">Cargando ficha…</p>
      </section>
    )
  }

  if (!client) {
    return (
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
    )
  }

  return (
    <>
      <section className="clientFeature__identityBand" aria-labelledby="client-profile-title">
        <span
          className="clientFeature__clientAvatar"
          aria-hidden="true"
          style={{ viewTransitionName: avatarTransitionName }}
        >
          <componentComponents.avatar size="lg">
            {getClientInitials(client.firstName, client.lastName)}
          </componentComponents.avatar>
        </span>

        <div className="clientFeature__identityBody">
          <div className="clientFeature__identityTitle">
            <h1 id="client-profile-title" className="clientFeature__identityName">
              {client.firstName} {client.lastName}
            </h1>
            {clientStatusBadge(client.status)}
          </div>

          <p className="clientFeature__identityMeta">
            <span>Doc. {client.documentNumber}</span>
            <span aria-hidden="true" className="clientFeature__identityDot">·</span>
            {client.phone ? (
              <a href={`tel:${client.phone}`} className="clientFeature__identityLink">
                {client.phone}
              </a>
            ) : (
              <span>Sin celular</span>
            )}
            <span aria-hidden="true" className="clientFeature__identityDot">·</span>
            <a href={`mailto:${client.email}`} className="clientFeature__identityLink break-all">
              {client.email}
            </a>
          </p>
        </div>
      </section>

      <div className="clientFeature__fichaGrid">
        <section
          className="clientFeature__card clientFeature__fichaMembership"
          id="memberships"
          aria-labelledby="membership-current-title"
        >
          <div className="clientFeature__sectionHeading">
            <div>
              <h2 id="membership-current-title" className="clientFeature__sectionTitle">
                Membresía vigente
              </h2>
              {activeMembership && (
                <p className="mt-1 text-[12px] text-muted">
                  {membershipStatusLabels[activeMembership.status]}
                </p>
              )}
            </div>
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
            <p className="py-4 text-sm text-muted">Consultando membresía vigente…</p>
          ) : profile.activeMembershipQuery.isError ? (
            <div className="pt-2">
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
              <dl className="clientFeature__membershipSummary">
                <div>
                  <dt>Plan</dt>
                  <dd>{membershipTypeLabels[activeMembership.type]}</dd>
                </div>
                <div>
                  <dt>Precio</dt>
                  <dd>{formatMoney(activeMembership.price)}</dd>
                </div>
                <div>
                  <dt>Periodo</dt>
                  <dd>
                    {formatDate(activeMembership.startDate)} – {formatDate(activeMembership.endDate)}
                  </dd>
                </div>
              </dl>
              <membershipProgressComponents.membershipProgress membership={activeMembership} />
            </>
          ) : (
            <p className="pt-1 text-[13px] text-muted">
              No hay una suscripción vigente para este cliente.
            </p>
          )}
        </section>

        <section
          className="clientFeature__card clientFeature__fichaData"
          aria-labelledby="client-identity-title"
        >
          <h2 id="client-identity-title" className="clientFeature__sectionTitle">
            Datos del cliente
          </h2>
          <dl className="clientFeature__dataList">
            <div>
              <dt>Fecha de nacimiento</dt>
              <dd>{formatDate(client.birthDate)}</dd>
            </div>
            <div>
              <dt>Sexo</dt>
              <dd>
                {client.sex === 'F' ? 'Femenino' : client.sex === 'M' ? 'Masculino' : '—'}
              </dd>
            </div>
            <div>
              <dt>Objetivo de entrenamiento</dt>
              <dd>{client.fitnessGoal || 'No se ha registrado un objetivo.'}</dd>
            </div>
          </dl>
        </section>

        <section
          className="clientFeature__card clientFeature__fichaHistory"
          id="membership-history"
          aria-labelledby="membership-history-title"
        >
          <h2 id="membership-history-title" className="clientFeature__sectionTitle">
            Historial de membresías
          </h2>
          {profile.membershipsQuery.isPending ? (
            <p className="py-4 text-sm text-muted">Cargando historial…</p>
          ) : profile.membershipsQuery.isError ? (
            <div className="py-3">
              <p className="text-[13px] text-muted">No se pudo cargar el historial.</p>
              <componentComponents.button
                variant="quiet"
                size="sm"
                className="clientFeature__button mt-3"
                onClick={() => void profile.membershipsQuery.refetch()}
              >
                Reintentar
              </componentComponents.button>
            </div>
          ) : profile.membershipsQuery.data.content.length === 0 ? (
            <p className="py-4 text-[13px] text-muted">Todavía no hay membresías registradas.</p>
          ) : (
            <>
              <ul className="clientFeature__historyList">
                {profile.membershipsQuery.data.content.map((membership) => (
                  <li key={membership.id} className="clientFeature__historyItem">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{membershipTypeLabels[membership.type]}</p>
                        <p className="mt-1 text-[12px] text-muted">
                          {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
                        </p>
                      </div>
                      {membershipStatus(membership.status)}
                    </div>
                    <p className="mt-2 text-[12.5px] text-muted">
                      {formatMoney(membership.price)}
                    </p>
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
          className="clientFeature__card clientFeature__fichaPayments"
          id="payments"
          aria-labelledby="client-payments-title"
        >
          <h2 id="client-payments-title" className="clientFeature__sectionTitle">
            Pagos
          </h2>
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
