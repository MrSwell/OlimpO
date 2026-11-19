/* oxlint-disable react/rules-of-hooks */
import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import {
  LuArrowUpRight as luArrowUpRight,
  LuBackpack as luBackpack,
  LuBoxes as luBoxes,
  LuCupSoda as luCupSoda,
  LuDumbbell as luDumbbell,
  LuPill as luPill,
  LuPlus as luPlus,
  LuShirt as luShirt,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import * as componentComponents from '@/components'
import {
  displayUnit,
  getStockState,
  resolveCategoryKey,
  type CategoryKey,
  type InventoryItem,
} from '../model/inventoryTypes'
import { identityColorVar } from '@/lib/colorIdentity'
import * as itemFormDialogComponents from './itemFormDialog'
import { useInventoryDirectory } from '../hooks/useInventoryDirectory'
import './inventoryFeature.css'

const viewOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'low', label: 'Stock bajo' },
] as const

const categoryIcons: Record<Exclude<CategoryKey, 'other'>, IconType> = {
  equipment: luDumbbell,
  supplements: luPill,
  drinks: luCupSoda,
  accessories: luBackpack,
  apparel: luShirt,
}

const inventoryItemCard = (item: InventoryItem) => {
  const key = resolveCategoryKey(item.category)
  const accent = identityColorVar(item.category?.trim() || item.name)
  const Icon = key === 'other' ? luBoxes : categoryIcons[key]
  const unit = displayUnit(item.unit)
  const stock = getStockState(item)
  const fill = item.minStock > 0
    ? Math.min(100, Math.round((item.quantity / (item.minStock * 2)) * 100))
    : 100
  const cardStyle = {
    viewTransitionName: `inventory-item-${item.id}`,
    '--card-accent': accent,
  } as CSSProperties

  return (
    <article className="inventoryFeature__itemCard" style={cardStyle}>
      <div className="inventoryFeature__itemHeader">
        <span
          className="inventoryFeature__categoryIcon"
          style={{
            color: accent,
            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${accent} 26%, var(--line))`,
          }}
          aria-hidden="true"
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-[15.5px] font-semibold leading-snug">
            {item.name}
          </h3>
          <p className="inventoryFeature__itemCategory">
            {item.category || 'Sin categoría'}
          </p>
        </div>
      </div>

      <div className="inventoryFeature__stockBlock">
        <div className="inventoryFeature__stockRow">
          <p className="inventoryFeature__stockValue">
            <span className="inventoryFeature__stockNumber">{item.quantity}</span>
            {unit && (
              <span className="inventoryFeature__stockUnit">{unit}</span>
            )}
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

      <footer className="inventoryFeature__itemFooter">
        <span className="inventoryFeature__statusChip" data-tone={stock.tone}>
          <span aria-hidden="true" className="inventoryFeature__statusDot" />
          {stock.label}
        </span>
        <Link
          to={`/inventory/${item.id}`}
          viewTransition
          className="inventoryFeature__itemAction"
          aria-label={`Ver ficha de ${item.name}`}
        >
          Ver ficha <componentComponents.icon icon={luArrowUpRight} size="sm" />
        </Link>
      </footer>
    </article>
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
          <p className="py-12 text-center text-sm text-muted">
            Cargando inventario…
          </p>
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

  const pageItems = data.content
  const attentionItems = pageItems.filter((item) => getStockState(item).tone !== 'ok')
  const lowCount = pageItems.filter((item) => getStockState(item).tone === 'low').length
  const categoryCount = new Set(
    pageItems.map((item) => item.category?.trim() || 'Sin categoría'),
  ).size

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
        <div className="inventoryFeature__layout">
          <ul className="inventoryFeature__grid" role="list">
            {data.content.map((item) => (
              <li key={item.id} className="inventoryFeature__gridItem">
                {inventoryItemCard(item)}
              </li>
            ))}
          </ul>

          <aside className="inventoryFeature__aside" aria-label="Resumen del inventario">
            <section className="inventoryFeature__summaryCard">
              <h2 className="inventoryFeature__summaryTitle">Requiere atención</h2>
              {attentionItems.length === 0 ? (
                <p className="inventoryFeature__summaryEmpty">
                  Todo el stock está por encima del mínimo.
                </p>
              ) : (
                <ul className="inventoryFeature__alertList" role="list">
                  {attentionItems.slice(0, 4).map((item) => {
                    const state = getStockState(item)
                    return (
                      <li key={item.id}>
                        <Link
                          to={`/inventory/${item.id}`}
                          viewTransition
                          className="inventoryFeature__alertRow"
                        >
                          <span
                            className="inventoryFeature__statusDot"
                            data-tone={state.tone}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1 truncate">{item.name}</span>
                          <span className="inventoryFeature__alertCount">
                            {item.quantity}/{item.minStock}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="inventoryFeature__summaryCard">
              <h2 className="inventoryFeature__summaryTitle">Resumen</h2>
              <dl className="inventoryFeature__summaryList">
                <div>
                  <dt>En esta página</dt>
                  <dd>{pageItems.length}</dd>
                </div>
                <div>
                  <dt>Stock bajo</dt>
                  <dd data-tone={lowCount > 0 ? 'low' : undefined}>{lowCount}</dd>
                </div>
                <div>
                  <dt>Categorías</dt>
                  <dd>{categoryCount}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
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
