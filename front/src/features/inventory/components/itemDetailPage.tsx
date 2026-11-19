/* oxlint-disable react/rules-of-hooks */
import { useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router'
import {
  LuArrowDownLeft as luArrowDownLeft,
  LuArrowLeft as luArrowLeft,
  LuArrowUpRight as luArrowUpRight,
  LuBackpack as luBackpack,
  LuBoxes as luBoxes,
  LuCupSoda as luCupSoda,
  LuDumbbell as luDumbbell,
  LuPencil as luPencil,
  LuPill as luPill,
  LuShirt as luShirt,
  LuTrash2 as luTrash2,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import * as componentComponents from '@/components'
import { identityColorVar } from '@/lib/colorIdentity'
import { formatMovementDate } from '../model/inventoryFormatting'
import {
  displayUnit,
  getStockState,
  inventoryMovementTypeLabels,
  resolveCategoryKey,
  type CategoryKey,
  type InventoryMovement,
} from '../model/inventoryTypes'
import * as itemFormDialogComponents from './itemFormDialog'
import * as movementDialogComponents from './movementDialog'
import { useItemDetail } from '../hooks/useItemDetail'
import { useDeleteItem } from '../hooks/useDeleteItem'
import './inventoryFeature.css'

const movementIcon = (type: InventoryMovement['type']) =>
  type === 'OUTBOUND' ? luArrowUpRight : luArrowDownLeft

const categoryIcons: Record<Exclude<CategoryKey, 'other'>, IconType> = {
  equipment: luDumbbell,
  supplements: luPill,
  drinks: luCupSoda,
  accessories: luBackpack,
  apparel: luShirt,
}

export const itemDetailPage = () => {
  const { itemId: rawItemId } = useParams()
  const detail = useItemDetail(rawItemId)
  const hasValidItemId = detail.hasValidItemId
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const itemQuery = detail.itemQuery
  const item = itemQuery.data
  const movementsData = detail.movementsQuery.data
  const deleteItem = useDeleteItem()

  const header = (
    <div className="mb-6">
      <Link to="/inventory" viewTransition className="inventoryFeature__backLink">
        <componentComponents.icon icon={luArrowLeft} size="sm" />
        Volver al inventario
      </Link>
    </div>
  )

  if (!hasValidItemId) {
    return (
      <>
        {header}
        <section className="inventoryFeature__card">
          <componentComponents.emptyState
            icon={luBoxes}
            title="Ítem no válido"
            description="Vuelve al directorio y elige un ítem."
            action={
              <Link to="/inventory" className="inventoryFeature__actionLink">
                Ir al inventario
              </Link>
            }
          />
        </section>
      </>
    )
  }

  if (itemQuery.isPending) {
    return (
      <>
        {header}
        <section className="inventoryFeature__card">
          <p className="py-12 text-center text-sm text-muted">Cargando ítem…</p>
        </section>
      </>
    )
  }

  if (itemQuery.isError || !item) {
    return (
      <>
        {header}
        <section className="inventoryFeature__card">
          <componentComponents.emptyState
            icon={luBoxes}
            title="No se pudo cargar el ítem"
            description="Puede que el ítem no exista o que la conexión falle."
            action={
              <componentComponents.button
                variant="default"
                onClick={() => void itemQuery.refetch()}
              >
                Reintentar
              </componentComponents.button>
            }
          />
        </section>
      </>
    )
  }

  const categoryKey = resolveCategoryKey(item.category)
  const accent = identityColorVar(item.category?.trim() || item.name)
  const CategoryIcon = categoryKey === 'other' ? luBoxes : categoryIcons[categoryKey]
  const stock = getStockState(item)
  const unit = displayUnit(item.unit)
  const fill = item.minStock > 0
    ? Math.min(100, Math.round((item.quantity / (item.minStock * 2)) * 100))
    : 100

  return (
    <>
      {header}

      <div className="inventoryFeature__detailLayout mb-6">
        <section
          className="inventoryFeature__detailPanel"
          style={{ '--card-accent': accent } as CSSProperties}
        >
          <div className="inventoryFeature__detailBody">
            <div className="inventoryFeature__detailIdentity">
              <span
                className="inventoryFeature__categoryIcon"
                style={{
                  color: accent,
                  background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                  borderColor: `color-mix(in srgb, ${accent} 26%, var(--line))`,
                }}
                aria-hidden="true"
              >
                <CategoryIcon size={18} />
              </span>
              <div className="min-w-0">
                <h1
                  className="inventoryFeature__detailName"
                  style={{ viewTransitionName: `inventory-item-${item.id}` }}
                >
                  {item.name}
                </h1>
                <div className="inventoryFeature__detailMetaRow">
                  <p className="inventoryFeature__detailCategory">
                    {item.category || 'Sin categoría'}
                  </p>
                  <span className="inventoryFeature__statusChip" data-tone={stock.tone}>
                    <span aria-hidden="true" className="inventoryFeature__statusDot" />
                    {stock.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="inventoryFeature__detailStock">
              <div className="inventoryFeature__detailStockRow">
                <p className="inventoryFeature__detailQuantity">
                  <span className="inventoryFeature__detailNumber">{item.quantity}</span>
                  {unit && <span className="inventoryFeature__detailUnit">{unit}</span>}
                </p>
                <p className="inventoryFeature__stockMin">
                  Mínimo {item.minStock}
                  {unit ? ` ${unit}` : ''}
                </p>
              </div>
              <div
                className="inventoryFeature__stockBar"
                data-tone={stock.tone}
                aria-hidden="true"
              >
                <span style={{ width: `${fill}%` }} />
              </div>
            </div>
          </div>

          <div className="inventoryFeature__detailActions">
            <button
              type="button"
              className="inventoryFeature__actionLink"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <componentComponents.icon icon={luPencil} size="sm" />
              Editar
            </button>
            <button
              type="button"
              className="inventoryFeature__actionLink"
              onClick={() => setIsMovementDialogOpen(true)}
            >
              <componentComponents.icon icon={luArrowDownLeft} size="sm" />
              Registrar movimiento
            </button>
            <button
              type="button"
              className="inventoryFeature__deleteAction"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <componentComponents.icon icon={luTrash2} size="sm" />
              Eliminar
            </button>
          </div>
        </section>

        <section className="inventoryFeature__card inventoryFeature__movementsCard">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="inventoryFeature__sectionTitle">Movimientos</h2>
            <span aria-live="polite" className="text-xs text-faint">
              {detail.movementsQuery.isFetching
                ? 'Actualizando…'
                : `${movementsData?.totalElements ?? 0} registrados`}
            </span>
          </div>

          {detail.movementsQuery.isPending ? (
            <p className="py-8 text-center text-[13px] text-muted">Cargando movimientos…</p>
          ) : detail.movementsQuery.isError ? (
            <componentComponents.emptyState
              title="No se pudo cargar el historial"
              description="Comprueba tu conexión e inténtalo de nuevo."
              action={
                <componentComponents.button
                  variant="quiet"
                  onClick={() => void detail.movementsQuery.refetch()}
                >
                  Reintentar
                </componentComponents.button>
              }
            />
          ) : !movementsData || movementsData.content.length === 0 ? (
            <componentComponents.emptyState
              icon={luArrowDownLeft}
              title="Sin movimientos"
              description="Registra la primera entrada o salida de este ítem."
            />
          ) : (
            <ul className="grid">
              {movementsData.content.map((movement) => (
                <li key={movement.id} className="inventoryFeature__movementItem flex gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-control border border-line text-muted"
                  >
                    <componentComponents.icon icon={movementIcon(movement.type)} size="sm" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[13px] font-medium text-ink">
                        {inventoryMovementTypeLabels[movement.type]} · {movement.quantity}
                      </p>
                      <p className="text-[11.5px] text-faint tabular-nums">
                        {formatMovementDate(movement.movementDate)}
                      </p>
                    </div>
                    <p className="mt-0.5 break-words text-[12px] text-muted">
                      {movement.observation || 'Sin observación'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {movementsData && movementsData.totalPages > 1 && (
            <componentComponents.pagination
              page={detail.movementPage + 1}
              pageSize={detail.movementPageSize}
              totalItems={movementsData.totalElements}
              totalPages={movementsData.totalPages}
              onPageChange={(nextPage) => detail.setMovementPage(nextPage - 1)}
            />
          )}
        </section>
      </div>

      <itemFormDialogComponents.itemFormDialog
        open={isEditDialogOpen}
        item={item}
        onClose={() => setIsEditDialogOpen(false)}
      />
      <movementDialogComponents.movementDialog
        itemId={item.id}
        open={isMovementDialogOpen}
        onClose={() => setIsMovementDialogOpen(false)}
        onRegistered={() => {
          setIsMovementDialogOpen(false)
          detail.setMovementPage(0)
        }}
      />
      <componentComponents.confirmDialog
        open={isDeleteDialogOpen}
        title="Eliminar ítem"
        description={
          <>
            Se eliminará «{item.name}» y su historial de movimientos. Esta acción no se puede
            deshacer.
          </>
        }
        confirmLabel="Eliminar"
        isSubmitting={deleteItem.isPending}
        onConfirm={() => deleteItem.mutate({ id: item.id, name: item.name })}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  )
}
