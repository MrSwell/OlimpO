/* oxlint-disable react/rules-of-hooks */
import { LuArrowDownLeft as luArrowDownLeft, LuArrowUpRight as luArrowUpRight } from 'react-icons/lu'
import * as componentComponents from '@/components'
import { inventoryMovementTypeLabels } from '../model/inventoryTypes'
import { useMovementForm } from '../hooks/useMovementForm'

interface MovementDialogProps {
  itemId: number
  open: boolean
  onClose: () => void
  onRegistered: () => void
}

export const movementDialog = ({ itemId, open, onClose, onRegistered }: MovementDialogProps) => {
  const { form, submit, isSubmitting } = useMovementForm({
    itemId,
    isDialogOpen: open,
    onRegistered,
  })
  const errors = form.formState.errors
  const selectedType = form.watch('type')

  return (
    <componentComponents.modal
      open={open}
      onClose={onClose}
      title="Registrar movimiento"
      icon={selectedType === 'OUTBOUND' ? luArrowUpRight : luArrowDownLeft}
      footer={
        <>
          <componentComponents.button variant="quiet" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </componentComponents.button>
          <componentComponents.button
            type="submit"
            form="inventory-movement-form"
            variant="default"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registrando…' : 'Registrar movimiento'}
          </componentComponents.button>
        </>
      }
    >
      <form id="inventory-movement-form" onSubmit={submit} noValidate className="grid gap-4">
        <componentComponents.field label="Tipo" htmlFor="inventory-movement-type" error={errors.type?.message}>
          <componentComponents.select
            id="inventory-movement-type"
            aria-invalid={Boolean(errors.type)}
            aria-describedby={errors.type ? 'inventory-movement-type-error' : undefined}
            {...form.register('type')}
            disabled={isSubmitting}
          >
            {Object.entries(inventoryMovementTypeLabels).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </componentComponents.select>
        </componentComponents.field>

        <componentComponents.field
          label="Cantidad"
          htmlFor="inventory-movement-quantity"
          hint={
            selectedType === 'OUTBOUND'
              ? 'Si supera el stock, el backend rechaza el movimiento (409).'
              : 'Entero mayor que cero.'
          }
          error={errors.quantity?.message}
        >
          <componentComponents.input
            id="inventory-movement-quantity"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={errors.quantity ? 'inventory-movement-quantity-error' : undefined}
            {...form.register('quantity')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <componentComponents.field
          label="Observación (opcional)"
          htmlFor="inventory-movement-observation"
          error={errors.observation?.message}
        >
          <componentComponents.input
            id="inventory-movement-observation"
            maxLength={255}
            aria-invalid={Boolean(errors.observation)}
            aria-describedby={errors.observation ? 'inventory-movement-observation-error' : undefined}
            placeholder="Motivo o nota del movimiento"
            {...form.register('observation')}
            disabled={isSubmitting}
          />
        </componentComponents.field>
      </form>
    </componentComponents.modal>
  )
}
