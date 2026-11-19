/* oxlint-disable react/rules-of-hooks */
import {
  LuBackpack as luBackpack,
  LuBoxes as luBoxes,
  LuCupSoda as luCupSoda,
  LuDumbbell as luDumbbell,
  LuPill as luPill,
  LuShirt as luShirt,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import * as componentComponents from '@/components'
import {
  categoryPresetLabels,
  normalizeCategoryName,
  type CategoryKey,
} from '../model/inventoryTypes'
import type { InventoryItem } from '../model/inventoryTypes'
import { useInventoryItemForm } from '../hooks/useInventoryItemForm'

interface ItemFormDialogProps {
  open: boolean
  item: InventoryItem | null
  onClose: () => void
}

interface PresetOption {
  key: Exclude<CategoryKey, 'other'>
  label: string
  icon: IconType
}

const presetOptions: PresetOption[] = [
  { key: 'equipment', label: categoryPresetLabels.equipment, icon: luDumbbell },
  { key: 'supplements', label: categoryPresetLabels.supplements, icon: luPill },
  { key: 'drinks', label: categoryPresetLabels.drinks, icon: luCupSoda },
  { key: 'accessories', label: categoryPresetLabels.accessories, icon: luBackpack },
  { key: 'apparel', label: categoryPresetLabels.apparel, icon: luShirt },
]

export const itemFormDialog = ({ open, item, onClose }: ItemFormDialogProps) => {
  const { form, submit, isSubmitting } = useInventoryItemForm({
    item,
    onSaved: onClose,
  })
  const errors = form.formState.errors
  const categoryValue = form.watch('category')
  const normalizedCategory = normalizeCategoryName(categoryValue ?? '')
  const activePreset = presetOptions.find(
    (option) => normalizeCategoryName(option.label) === normalizedCategory,
  )
  const isCustomCategory = normalizedCategory !== '' && !activePreset

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
          label="Categoría"
          htmlFor={isCustomCategory || categoryValue === '' ? 'inventory-item-category-custom' : undefined}
          error={errors.category?.message}
        >
          <div
            className="inventoryFeature__presetGrid"
            role="group"
            aria-label="Categoría del ítem"
          >
            {presetOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={activePreset?.key === option.key}
                className="inventoryFeature__presetChip"
                onClick={() =>
                  form.setValue('category', option.label, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <option.icon aria-hidden="true" style={{ color: 'var(--gold-strong)' }} />
                {option.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={isCustomCategory || categoryValue === ''}
              className="inventoryFeature__presetChip"
              onClick={() => form.setValue('category', '', { shouldValidate: true })}
              disabled={isSubmitting}
            >
              Otro…
            </button>
          </div>
          {(isCustomCategory || categoryValue === '') && (
            <div className="mt-2.5">
              <componentComponents.input
                id="inventory-item-category-custom"
                maxLength={100}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={errors.category ? 'inventory-item-category-error' : undefined}
                placeholder="Escribe una categoría libre…"
                {...form.register('category')}
                disabled={isSubmitting}
              />
            </div>
          )}
        </componentComponents.field>

        <div className="inventoryFeature__stockGrid">
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
