/* oxlint-disable react/rules-of-hooks */
import {
  LuArrowUpRight as luArrowUpRight,
  LuReceipt as luReceipt,
  LuSearch as luSearch,
} from 'react-icons/lu'
import { Link } from 'react-router'
import * as componentComponents from '@/components'
import {
  formatDate,
  formatMoney,
} from '@/features/clients/model/clientFormatting'
import {
  membershipStatusLabels,
  membershipTypeLabels,
  paymentMethodLabels,
} from '@/features/clients/model/clientTypes'
import * as paymentHistoryComponents from './paymentHistory'
import { usePaymentsPage } from '../hooks/usePaymentsPage'
import './paymentFeature.css'

const clientName = (firstName: string, lastName: string): string => `${firstName} ${lastName}`

export const paymentsPage = () => {
  const payments = usePaymentsPage()
  const selectedClient = payments.clientQuery.data
  const memberships = payments.membershipsQuery.data?.content ?? []
  const membershipField = payments.form.register('membershipId')
  const selectedMembership = memberships.find(
    (membership) => String(membership.id) === payments.form.watch('membershipId'),
  )
  const paymentData = payments.paymentsQuery.data
  const pageTotal =
    paymentData?.content.reduce((total, payment) => total + payment.amount, 0) ?? 0
  const searchTerm = payments.search.trim()
  const searchReady = searchTerm.length >= 2 && payments.debouncedSearch === searchTerm
  const errors = payments.form.formState.errors

  return (
    <>
      <componentComponents.pageHead
        title="Pagos"
        lede="Registra pagos asociados a una membresía y consulta el historial por cliente."
      />

      <div className="paymentFeature__grid">
        <section
          className="paymentFeature__card paymentFeature__formCard"
          aria-labelledby="payment-form-title"
        >
          <h2 id="payment-form-title" className="text-[16px] font-semibold">
            Registrar pago
          </h2>

          {payments.selectedClientId === null ? (
            <div className="mt-5">
              <componentComponents.field
                label="Buscar cliente"
                htmlFor="payment-client-search"
                hint="Escribe al menos 2 caracteres de nombre, correo o documento."
              >
                <componentComponents.input
                  id="payment-client-search"
                  icon={luSearch}
                  type="search"
                  autoComplete="off"
                  value={payments.search}
                  onChange={(event) => payments.setSearch(event.currentTarget.value)}
                  placeholder="Nombre, correo o documento"
                  disabled={payments.isSubmitting}
                />
              </componentComponents.field>

              {searchReady && (
                <div className="mt-3" aria-live="polite">
                  {payments.clientSearchQuery.isPending ? (
                    <p className="py-3 text-[13px] text-muted">Buscando clientes…</p>
                  ) : payments.clientSearchQuery.isError ? (
                    <componentComponents.emptyState
                      title="No se pudo buscar"
                      description="Comprueba tu conexión e inténtalo de nuevo."
                      action={
                        <componentComponents.button
                          variant="quiet"
                          size="sm"
                          onClick={() => void payments.clientSearchQuery.refetch()}
                        >
                          Reintentar
                        </componentComponents.button>
                      }
                    />
                  ) : payments.clientSearchQuery.data?.content.length === 0 ? (
                    <p className="py-3 text-[13px] text-muted">No encontramos coincidencias.</p>
                  ) : (
                    <>
                      <ul aria-label="Resultados de clientes">
                        {payments.clientSearchQuery.data?.content.map((client) => (
                          <li key={client.id}>
                            <button
                              type="button"
                              className="paymentFeature__clientResult"
                              onClick={() => payments.selectClient(client)}
                              disabled={payments.isSubmitting}
                            >
                              <span className="min-w-0">
                                <span className="block break-words text-[13px] font-medium">
                                  {clientName(client.firstName, client.lastName)}
                                </span>
                                <span className="mt-1 block break-all text-[12px] text-muted">
                                  {client.email} · {client.documentNumber}
                                </span>
                              </span>
                              <componentComponents.icon
                                icon={luArrowUpRight}
                                size="sm"
                                className="shrink-0 text-muted"
                              />
                            </button>
                          </li>
                        ))}
                      </ul>
                      {(payments.clientSearchQuery.data?.totalElements ?? 0) >
                        (payments.clientSearchQuery.data?.content.length ?? 0) && (
                        <p className="pt-2 text-[11.5px] text-faint">
                          Se muestran los primeros resultados. Afina la búsqueda para encontrar
                          otros clientes.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : payments.clientQuery.isPending ? (
            <p className="py-6 text-[13px] text-muted">Cargando cliente…</p>
          ) : payments.clientQuery.isError || !selectedClient ? (
            <componentComponents.emptyState
              title="No se pudo cargar el cliente"
              description="Comprueba que el cliente exista y vuelve a intentarlo."
              action={
                <componentComponents.button
                  variant="default"
                  size="sm"
                  onClick={payments.clearClient}
                >
                  Elegir otro
                </componentComponents.button>
              }
            />
          ) : (
            <>
              <div className="paymentFeature__selectedClient mt-5">
                <div className="paymentFeature__selectedClientInfo">
                  <p className="break-words text-[14px] font-medium">
                    {clientName(selectedClient.firstName, selectedClient.lastName)}
                  </p>
                  <p className="mt-1 break-all text-[12px] text-muted">{selectedClient.email}</p>
                </div>
                <componentComponents.button
                  variant="quiet"
                  size="sm"
                  onClick={payments.clearClient}
                  disabled={payments.isSubmitting}
                >
                  Cambiar
                </componentComponents.button>
              </div>

              {payments.membershipsQuery.isPending ? (
                <p className="py-6 text-[13px] text-muted">Cargando membresías…</p>
              ) : payments.membershipsQuery.isError ? (
                <componentComponents.emptyState
                  title="No se pudieron cargar las membresías"
                  description="Vuelve a intentarlo antes de registrar un pago."
                  action={
                    <componentComponents.button
                      variant="quiet"
                      size="sm"
                      onClick={() => void payments.membershipsQuery.refetch()}
                    >
                      Reintentar
                    </componentComponents.button>
                  }
                />
              ) : memberships.length === 0 ? (
                <componentComponents.emptyState
                  title="No hay membresías para asociar"
                  description="Registra una membresía desde la ficha del cliente antes de ingresar un pago."
                  action={
                    <Link
                      to={`/clients/${selectedClient.id}`}
                      className="paymentFeature__actionLink"
                    >
                      Abrir ficha
                    </Link>
                  }
                />
              ) : (
                <form className="mt-5" onSubmit={payments.submit} noValidate>
                  <div className="paymentFeature__formGrid">
                    <componentComponents.field
                      label="Membresía"
                      htmlFor="payment-membership"
                      error={errors.membershipId?.message}
                      className="paymentFeature__fullWidth"
                    >
                      <componentComponents.select
                        id="payment-membership"
                        aria-invalid={Boolean(errors.membershipId)}
                        aria-describedby={
                          errors.membershipId ? 'payment-membership-error' : undefined
                        }
                        {...membershipField}
                        disabled={payments.isSubmitting}
                        onChange={(event) => {
                          membershipField.onChange(event)
                          const membership = memberships.find(
                            (item) => String(item.id) === event.currentTarget.value,
                          )
                          if (membership) {
                            payments.form.setValue('amount', String(membership.price), {
                              shouldValidate: true,
                            })
                          }
                        }}
                      >
                        {memberships.map((membership) => (
                          <option key={membership.id} value={membership.id}>
                            {membershipTypeLabels[membership.type]} ·{' '}
                            {membershipStatusLabels[membership.status]} · vence{' '}
                            {formatDate(membership.endDate)}
                          </option>
                        ))}
                      </componentComponents.select>
                    </componentComponents.field>

                    {selectedMembership && (
                      <div className="paymentFeature__fullWidth text-[12px] text-muted">
                        {formatDate(selectedMembership.startDate)} –{' '}
                        {formatDate(selectedMembership.endDate)} · Precio{' '}
                        {formatMoney(selectedMembership.price)}
                      </div>
                    )}

                    <componentComponents.field
                      label="Monto (COP)"
                      htmlFor="payment-amount"
                      error={errors.amount?.message}
                    >
                      <componentComponents.input
                        id="payment-amount"
                        type="number"
                        min="0.01"
                        max="99999999.99"
                        step="0.01"
                        inputMode="decimal"
                        aria-invalid={Boolean(errors.amount)}
                        aria-describedby={errors.amount ? 'payment-amount-error' : undefined}
                        {...payments.form.register('amount')}
                        disabled={payments.isSubmitting}
                      />
                    </componentComponents.field>

                    <componentComponents.field
                      label="Método de pago"
                      htmlFor="payment-method"
                      error={errors.method?.message}
                    >
                      <componentComponents.select
                        id="payment-method"
                        aria-invalid={Boolean(errors.method)}
                        aria-describedby={errors.method ? 'payment-method-error' : undefined}
                        {...payments.form.register('method')}
                        disabled={payments.isSubmitting}
                      >
                        {Object.entries(paymentMethodLabels).map(([method, label]) => (
                          <option key={method} value={method}>
                            {label}
                          </option>
                        ))}
                      </componentComponents.select>
                    </componentComponents.field>

                    <componentComponents.field
                      label="Referencia (opcional)"
                      htmlFor="payment-reference"
                      hint="Número de recibo o referencia de transacción."
                      error={errors.reference?.message}
                      className="paymentFeature__fullWidth"
                    >
                      <componentComponents.input
                        id="payment-reference"
                        maxLength={100}
                        aria-invalid={Boolean(errors.reference)}
                        aria-describedby={errors.reference ? 'payment-reference-error' : undefined}
                        {...payments.form.register('reference')}
                        disabled={payments.isSubmitting}
                      />
                    </componentComponents.field>
                  </div>

                  <p className="mt-4 text-[11.5px] text-faint">
                    La fecha del pago la asigna el servidor al registrarlo.
                  </p>

                  <div className="paymentFeature__formFooter mt-5">
                    <componentComponents.button
                      type="submit"
                      variant="default"
                      size="sm"
                      icon={luReceipt}
                      disabled={payments.isSubmitting}
                    >
                      {payments.isSubmitting ? 'Registrando…' : 'Registrar pago'}
                    </componentComponents.button>
                  </div>
                </form>
              )}

              {!payments.isSubmitting &&
                payments.membershipsQuery.data?.totalPages &&
                payments.membershipsQuery.data.totalPages > 1 && (
                  <componentComponents.pagination
                    page={payments.membershipPage + 1}
                    pageSize={payments.membershipPageSize}
                    totalItems={payments.membershipsQuery.data.totalElements}
                    totalPages={payments.membershipsQuery.data.totalPages}
                    onPageChange={(nextPage) => payments.setMembershipPage(nextPage - 1)}
                  />
                )}
            </>
          )}
        </section>

        <section
          className="paymentFeature__card paymentFeature__historyCard"
          aria-labelledby="payment-history-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="payment-history-title" className="text-[16px] font-semibold">
                Historial de pagos
              </h2>
              {selectedClient && (
                <p className="mt-1 text-[12.5px] text-muted">
                  {clientName(selectedClient.firstName, selectedClient.lastName)}
                </p>
              )}
            </div>
          </div>

          {payments.selectedClientId === null ? (
            <componentComponents.emptyState
              icon={luReceipt}
              title="Selecciona un cliente"
              description="Busca un cliente para consultar sus pagos y el acumulado visible."
            />
          ) : (
            <>
              {paymentData && paymentData.content.length > 0 && (
                <div className="paymentFeature__historySummary mt-4">
                  <span className="text-[12px] text-muted">
                    Acumulado de esta página · {paymentData.content.length}{' '}
                    {paymentData.content.length === 1 ? 'pago' : 'pagos'}
                  </span>
                  <span className="text-[14px] font-medium tabular-nums">{formatMoney(pageTotal)}</span>
                </div>
              )}
              <paymentHistoryComponents.paymentHistory
                data={paymentData}
                isPending={
                  payments.clientQuery.isPending ||
                  (payments.clientQuery.isSuccess && payments.paymentsQuery.isPending)
                }
                isError={payments.paymentsQuery.isError || payments.clientQuery.isError}
                page={payments.paymentPage}
                pageSize={payments.paymentPageSize}
                onPageChange={payments.setPaymentPage}
                onRetry={() =>
                  void (payments.clientQuery.isError
                    ? payments.clientQuery.refetch()
                    : payments.paymentsQuery.refetch())
                }
              />
            </>
          )}
        </section>
      </div>
    </>
  )
}
