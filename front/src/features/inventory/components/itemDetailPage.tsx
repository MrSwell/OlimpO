/* oxlint-disable react/rules-of-hooks */
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  LuArrowDownLeft as luArrowDownLeft,
  LuArrowLeft as luArrowLeft,
  LuArrowUpRight as luArrowUpRight,
  LuBoxes as luBoxes,
  LuPencil as luPencil,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { formatMovementDate } from '../model/inventoryFormatting'
import {
  formatStock,
  inventoryMovementTypeLabels,
  type InventoryMovement,
} from '../model/inventoryTypes'
import * as itemFormDialogComponents from './itemFormDialog'
import * as movementDialogComponents from './movementDialog'
import { useItemDetail } from '../hooks/useItemDetail'
import './inventoryFeature.css'

const movementIcon = (type: InventoryMovement['type']) =>
  type === 'OUTBOUND' ? luArrowUpRight : luArrowDownLeft

export const itemDetailPage = () => {
  const { itemId: rawItemId } = useParams()
  const detail = useItemDetail(rawItemId)
  const hasValidItemId = detail.hasValidItemId
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)
  const itemQuery = detail.itemQuery
  const item = itemQuery.data
  const movementsData = detail.movementsQuery.data

  const header = (
    <div className="mb-6">
      <Link to="/inventory" className="inventoryFeature__backLink">
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

  return (
    <>
      {header}

      <div className="inventoryFeature__detailGrid mb-6">
        <section className="inventoryFeature__card inventoryFeature__itemCard">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="break-words text-[17px] font-semibold">{item.name}</h2>
              <p className="mt-1 text-[12.5px] text-muted">{item.category || 'Sin categoría'}</p>
            </div>
            <span className="inventoryFeature__stockCell text-[12.5px]">
              <span
                aria-hidden="true"
                className={`inventoryFeature__stockDot${item.lowStock ? ' inventoryFeature__stockDot--low' : ''}`}
              />
              {item.lowStock ? 'Stock bajo' : 'Stock suficiente'}
            </span>
          </div>

          <dl className="inventoryFeature__dataGrid mt-5 text-[12.5px]">
            <div>
              <dt className="text-faint">Stock actual</dt>
              <dd className="mt-1 tabular-nums text-[15px] font-medium text-ink">
                {formatStock(item)}
              </dd>
            </div>
            <div>
              <dt className="text-faint">Mínimo</dt>
              <dd className="mt-1 tabular-nums text-[15px] font-medium text-ink">{item.minStock}</dd>
            </div>
            <div>
              <dt className="text-faint">Unidad</dt>
              <dd className="mt-1 text-ink">{item.unit || '—'}</dd>
            </div>
          </dl>

          <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
            <button
              type="button"
              className="inventoryFeature__actionLink"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <componentComponents.icon icon={luPencil} size="sm" />
              Editar ítem
            </button>
            <button
              type="button"
              className="inventoryFeature__actionLink"
              onClick={() => setIsMovementDialogOpen(true)}
            >
              <componentComponents.icon icon={luArrowDownLeft} size="sm" />
              Registrar movimiento
            </button>
          </div>
        </section>

        <section className="inventoryFeature__card inventoryFeature__movementsCard">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-semibold">Movimientos</h2>
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
    </>
  )
}
