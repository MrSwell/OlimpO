/* oxlint-disable react/rules-of-hooks */
import { LuBoxes as luBoxes } from 'react-icons/lu'
import * as componentComponents from '@/components'
import type { InventoryItem } from '../model/inventoryTypes'
import { useInventoryItemForm } from '../hooks/useInventoryItemForm'

interface ItemFormDialogProps {
  open: boolean
  item: InventoryItem | null
  onClose: () => void
}

export const itemFormDialog = ({ open, item, onClose }: ItemFormDialogProps) => {
  const { form, submit, isSubmitting } = useInventoryItemForm({
    item,
    onSaved: onClose,
  })
  const errors = form.formState.errors

  return (
    <componentComponents.modal
      open={open}
      onClose={onClose}
      title={item ? 'Editar ítem' : 'Nuevo ítem'}
      icon={luBoxes}
      footer={
        <>
          <componentComponents.button
            variant="quiet"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </componentComponents.button>
          <componentComponents.button
            type="submit"
            form="inventory-item-form"
            variant="default"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : item ? 'Guardar cambios' : 'Crear ítem'}
          </componentComponents.button>
        </>
      }
    >
      <form id="inventory-item-form" onSubmit={submit} noValidate className="grid gap-4">
        <componentComponents.field label="Nombre" htmlFor="inventory-item-name" error={errors.name?.message}>
          <componentComponents.input
            id="inventory-item-name"
            maxLength={150}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'inventory-item-name-error' : undefined}
            placeholder="Pesas rusas, colchonetas, guantes…"
            {...form.register('name')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <componentComponents.field
          label="Categoría (opcional)"
          htmlFor="inventory-item-category"
          error={errors.category?.message}
        >
          <componentComponents.input
            id="inventory-item-category"
            maxLength={100}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'inventory-item-category-error' : undefined}
            placeholder="Accesorios, mantenimiento…"
            {...form.register('category')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <div className="grid grid-cols-2 gap-4">
          <componentComponents.field
            label="Stock"
            htmlFor="inventory-item-quantity"
            hint="Entero, sin negativos."
            error={errors.quantity?.message}
          >
            <componentComponents.input
              id="inventory-item-quantity"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              aria-invalid={Boolean(errors.quantity)}
              aria-describedby={errors.quantity ? 'inventory-item-quantity-error' : undefined}
              {...form.register('quantity')}
              disabled={isSubmitting}
            />
          </componentComponents.field>

          <componentComponents.field
            label="Mínimo"
            htmlFor="inventory-item-min-stock"
            hint="Alerta de stock bajo."
            error={errors.minStock?.message}
          >
            <componentComponents.input
              id="inventory-item-min-stock"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              aria-invalid={Boolean(errors.minStock)}
              aria-describedby={errors.minStock ? 'inventory-item-min-stock-error' : undefined}
              {...form.register('minStock')}
              disabled={isSubmitting}
            />
          </componentComponents.field>
        </div>

        <componentComponents.field
          label="Unidad (opcional)"
          htmlFor="inventory-item-unit"
          error={errors.unit?.message}
        >
          <componentComponents.input
            id="inventory-item-unit"
            maxLength={20}
            aria-invalid={Boolean(errors.unit)}
            aria-describedby={errors.unit ? 'inventory-item-unit-error' : undefined}
            placeholder="unidades, cajas, pares…"
            {...form.register('unit')}
            disabled={isSubmitting}
          />
        </componentComponents.field>
      </form>
    </componentComponents.modal>
  )
}
