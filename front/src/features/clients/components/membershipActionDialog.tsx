/* oxlint-disable react/rules-of-hooks */
import {
  LuCalendarDays as luCalendarDays,
  LuCreditCard as luCreditCard,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { formatDate } from '../model/clientFormatting'
import {
  membershipTypeLabels,
  paymentMethodLabels,
  type MembershipResponse,
  type MembershipType,
  type PaymentMethod,
} from '../model/clientTypes'
import { useMembershipAction } from '../hooks/useMembershipAction'

interface MembershipActionDialogProps {
  open: boolean
  clientId: number
  membership: MembershipResponse | null
  onClose: () => void
}

const membershipTypes: MembershipType[] = ['DAILY', 'QUARTERLY', 'MONTHLY']
const paymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'NEQUI']

export const membershipActionDialog = ({
  open,
  clientId,
  membership,
  onClose,
}: MembershipActionDialogProps) => {
  const { form, submit, renewalDates, isSubmitting } = useMembershipAction({
    open,
    clientId,
    membership,
    onSaved: onClose,
  })
  const errors = form.formState.errors

  return (
    <componentComponents.modal
      open={open}
      onClose={onClose}
      title={membership ? 'Renovar membresía' : 'Activar membresía'}
      icon={membership ? luCalendarDays : luCreditCard}
      footer={
        <>
          <componentComponents.button
            variant="quiet"
            size="sm"
            className="clientFeature__button"
            onClick={onClose}
          >
            Cancelar
          </componentComponents.button>
          <componentComponents.button
            type="submit"
            form="membership-action-form"
            variant="default"
            disabled={isSubmitting}
            size="sm"
            className="clientFeature__button"
          >
            {isSubmitting ? 'Guardando…' : membership ? 'Confirmar renovación' : 'Activar membresía'}
          </componentComponents.button>
        </>
      }
    >
      <form id="membership-action-form" onSubmit={submit} noValidate className="grid gap-4">
        {membership && renewalDates && (
          <div className="border-b border-line pb-4">
            <p className="text-[13px] leading-relaxed text-muted">
              El backend renueva desde la fecha más tardía entre hoy y el fin vigente. La
              estimación cambia según el tipo seleccionado.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <dt className="text-faint">Inicio del nuevo periodo</dt>
                <dd className="mt-1 text-ink">{formatDate(renewalDates.baseDate)}</dd>
              </div>
              <div>
                <dt className="text-faint">Fin estimado</dt>
                <dd className="mt-1 text-ink">{formatDate(renewalDates.renewedEndDate)}</dd>
              </div>
            </dl>
          </div>
        )}

        <componentComponents.field label="Tipo" htmlFor="membership-type" error={errors.type?.message}>
          <componentComponents.select
            id="membership-type"
            aria-invalid={Boolean(errors.type)}
            aria-describedby={errors.type ? 'membership-type-error' : undefined}
            {...form.register('type')}
          >
            {membershipTypes.map((type) => (
              <option key={type} value={type}>
                {membershipTypeLabels[type]}
              </option>
            ))}
          </componentComponents.select>
        </componentComponents.field>

        <componentComponents.field
          label="Precio (COP)"
          htmlFor="membership-price"
          error={errors.price?.message}
        >
          <componentComponents.input
            id="membership-price"
            type="number"
            min="0.01"
            max="99999999.99"
            step="0.01"
            inputMode="decimal"
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? 'membership-price-error' : undefined}
            {...form.register('price')}
          />
        </componentComponents.field>

        <componentComponents.field
          label="Método de pago"
          htmlFor="membership-method"
          error={errors.method?.message}
        >
          <componentComponents.select
            id="membership-method"
            aria-invalid={Boolean(errors.method)}
            aria-describedby={errors.method ? 'membership-method-error' : undefined}
            {...form.register('method')}
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabels[method]}
              </option>
            ))}
          </componentComponents.select>
        </componentComponents.field>

        <componentComponents.field
          label="Referencia de pago (opcional)"
          htmlFor="membership-reference"
          error={errors.reference?.message}
        >
          <componentComponents.input
            id="membership-reference"
            maxLength={100}
            aria-invalid={Boolean(errors.reference)}
            aria-describedby={errors.reference ? 'membership-reference-error' : undefined}
            {...form.register('reference')}
          />
        </componentComponents.field>

        {!membership && (
          <componentComponents.field
            label="Fecha de inicio (opcional)"
            htmlFor="membership-start-date"
            hint="Si se deja vacío, el backend usa la fecha de hoy."
            error={errors.startDate?.message}
          >
            <componentComponents.input
              id="membership-start-date"
              type="date"
              aria-invalid={Boolean(errors.startDate)}
              aria-describedby={errors.startDate ? 'membership-start-date-error' : undefined}
              {...form.register('startDate')}
            />
          </componentComponents.field>
        )}
      </form>
    </componentComponents.modal>
  )
}
