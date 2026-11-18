/* oxlint-disable react/rules-of-hooks */
import { useState } from 'react'
import { Link } from 'react-router'
import {
  LuArrowUpRight as luArrowUpRight,
  LuBoxes as luBoxes,
  LuPlus as luPlus,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import {
  getStockMeter,
  getStockState,
  type InventoryItem,
} from '../model/inventoryTypes'
import * as itemFormDialogComponents from './itemFormDialog'
import { useInventoryDirectory } from '../hooks/useInventoryDirectory'
import './inventoryFeature.css'

const viewOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'low', label: 'Stock bajo' },
] as const

const itemCard = (item: InventoryItem) => {
  const stock = getStockState(item)
  const meter = getStockMeter(item)

  return (
    <li key={item.id} className="inventoryFeature__itemCard">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-[15px] font-semibold leading-[1.25]">{item.name}</h3>
          <span className="inventoryFeature__categoryChip mt-2">
            {item.category || 'Sin categoría'}
          </span>
        </div>
        <span
          className="inventoryFeature__statusChip"
          data-tone={stock.tone}
        >
          <span aria-hidden="true" className="inventoryFeature__statusDot" />
          {stock.label}
        </span>
      </div>

      <div
        className="inventoryFeature__meter mt-5"
        role="img"
        aria-label={meter.description}
      >
        <span
          aria-hidden="true"
          className="inventoryFeature__meterFill"
          data-tone={stock.tone}
          style={{ width: `${meter.pct}%` }}
        />
        {meter.markerPct > 0 && (
          <span
            aria-hidden="true"
            className="inventoryFeature__meterMarker"
            style={{ left: `calc(${meter.markerPct}% - 1px)` }}
          />
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
        <div>
          <p className="text-[22px] font-medium leading-none tabular-nums">
            {item.quantity}
            {item.unit && (
              <span className="ml-1.5 text-[12px] font-normal text-faint">{item.unit}</span>
            )}
          </p>
          <p className="mt-1.5 text-[11.5px] text-faint">mínimo {item.minStock}</p>
        </div>
        <Link to={`/inventory/${item.id}`} className="inventoryFeature__actionLink">
          Ver ficha <componentComponents.icon icon={luArrowUpRight} size="sm" />
        </Link>
      </div>
    </li>
  )
}

export const inventoryPage = () => {
  const {
    view,
    setView,
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
    pageSize,
    itemsQuery,
  } = useInventoryDirectory()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const data = itemsQuery.data
  const isFiltering = Boolean(search.trim() || debouncedSearch)

  const header = (
    <componentComponents.pageHead
      title="Inventario"
      lede="Controla el stock de insumos y accesorios con alertas de stock bajo."
      actions={
        <componentComponents.button
          variant="primary"
          size="sm"
          icon={luPlus}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Nuevo ítem
        </componentComponents.button>
      }
    />
  )

  if (itemsQuery.isPending) {
    return (
      <>
        {header}
        <section className="inventoryFeature__card">
          <p className="py-12 text-center text-sm text-muted">Cargando inventario…</p>
        </section>
      </>
    )
  }

  if (itemsQuery.isError || !data) {
    return (
      <>
        {header}
        <section className="inventoryFeature__card">
          <componentComponents.emptyState
            icon={luBoxes}
            title="No se pudo cargar el inventario"
            description="Comprueba tu conexión y vuelve a intentarlo."
            action={
              <componentComponents.button
                variant="default"
                onClick={() => void itemsQuery.refetch()}
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

      <div className="inventoryFeature__filters mb-5">
        <componentComponents.searchInput
          id="inventory-search"
          aria-label="Buscar ítems por nombre o categoría"
          autoComplete="off"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Nombre o categoría"
          className="inventoryFeature__search"
        />

        <div
          className="inventoryFeature__viewToggle"
          role="group"
          aria-label="Filtrar inventario"
        >
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="inventoryFeature__viewButton"
              aria-pressed={view === option.value}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p aria-live="polite" className="ml-auto text-xs text-faint">
          {itemsQuery.isFetching
            ? 'Actualizando…'
            : view === 'low'
              ? `${data.totalElements} en stock bajo`
              : `${data.totalElements} ítems`}
        </p>
      </div>

      {data.content.length === 0 ? (
        <section className="inventoryFeature__card">
          <componentComponents.emptyState
            icon={luBoxes}
            title={
              isFiltering
                ? 'No encontramos coincidencias'
                : view === 'low'
                  ? 'Sin stock bajo'
                  : 'Aún no hay ítems'
            }
            description={
              isFiltering
                ? 'Prueba con otro nombre o categoría.'
                : view === 'low'
                  ? 'Ningún ítem está por debajo de su mínimo. Bien mantenido.'
                  : 'Cuando registres el primer ítem, aparecerá en este directorio.'
            }
            action={
              !isFiltering && (
                <componentComponents.button
                  variant="default"
                  icon={luPlus}
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Registrar ítem
                </componentComponents.button>
              )
            }
          />
        </section>
      ) : (
        <ul className="inventoryFeature__grid">
          {data.content.map(itemCard)}
        </ul>
      )}

      {data.totalPages > 1 && (
        <componentComponents.pagination
          page={page + 1}
          pageSize={pageSize}
          totalItems={data.totalElements}
          totalPages={data.totalPages}
          onPageChange={(nextPage) => setPage(nextPage - 1)}
        />
      )}

      <itemFormDialogComponents.itemFormDialog
        open={isCreateDialogOpen}
        item={null}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  )
}
