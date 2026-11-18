/* oxlint-disable react/rules-of-hooks */
import { useState } from 'react'
import { Link } from 'react-router'
import {
  LuArrowUpRight as luArrowUpRight,
  LuBoxes as luBoxes,
  LuPlus as luPlus,
  LuSearch as luSearch,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { formatStock } from '../model/inventoryTypes'
import type { InventoryItem } from '../model/inventoryTypes'
import * as itemFormDialogComponents from './itemFormDialog'
import { useInventoryDirectory } from '../hooks/useInventoryDirectory'
import './inventoryFeature.css'

const viewOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'low', label: 'Stock bajo' },
] as const

const stockCell = (item: InventoryItem) => (
  <span className="inventoryFeature__stockCell">
    <span
      aria-hidden="true"
      className={`inventoryFeature__stockDot${item.lowStock ? ' inventoryFeature__stockDot--low' : ''}`}
    />
    <span className="tabular-nums text-ink">{formatStock(item)}</span>
    <span className="text-[11.5px] text-faint">
      mín. {item.minStock}
      {item.lowStock ? ' · stock bajo' : ''}
    </span>
  </span>
)

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

  const header = (
    <componentComponents.pageHead
      title="Inventario"
      lede="Controla el stock de insumos y accesorios del gimnasio con alertas de stock bajo."
      className="mb-6"
      actions={
        <button
          type="button"
          className="inventoryFeature__actionLink"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <componentComponents.icon icon={luPlus} size="sm" />
          Nuevo ítem
        </button>
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
        <componentComponents.field label="Buscar ítems" htmlFor="inventory-search" className="inventoryFeature__search">
          <componentComponents.input
            id="inventory-search"
            icon={luSearch}
            type="search"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Nombre o categoría"
          />
        </componentComponents.field>

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
              search.trim() || debouncedSearch
                ? 'No encontramos coincidencias'
                : view === 'low'
                  ? 'Sin stock bajo'
                  : 'Aún no hay ítems'
            }
            description={
              search.trim() || debouncedSearch
                ? 'Prueba con otro nombre o categoría.'
                : view === 'low'
                  ? 'Ningún ítem está por debajo de su mínimo. Bien mantenido.'
                  : 'Cuando registres el primer ítem, aparecerá en este directorio.'
            }
            action={
              !search.trim() &&
              !debouncedSearch && (
                <button
                  type="button"
                  className="inventoryFeature__actionLink"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <componentComponents.icon icon={luPlus} size="sm" />
                  Registrar ítem
                </button>
              )
            }
          />
        </section>
      ) : (
        <section className="inventoryFeature__card">
          <componentComponents.dataTable<InventoryItem>
            getRowKey={(item) => item.id}
            rows={data.content}
            columns={[
              {
                key: 'name',
                header: 'Ítem',
                render: (item) => (
                  <div className="min-w-0">
                    <p className="break-words text-[13.5px] font-medium text-ink">{item.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-faint">{item.category || 'Sin categoría'}</p>
                  </div>
                ),
              },
              {
                key: 'stock',
                header: 'Stock',
                render: stockCell,
              },
              {
                key: 'unit',
                header: 'Unidad',
                render: (item) => item.unit || '—',
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (item) => (
                  <Link
                    to={`/inventory/${item.id}`}
                    className="inventoryFeature__actionLink"
                  >
                    Ver ficha <componentComponents.icon icon={luArrowUpRight} size="sm" />
                  </Link>
                ),
              },
            ]}
          />
        </section>
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
