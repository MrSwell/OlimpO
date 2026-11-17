// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { memo, useMemo, useState } from 'react'
import {
  LuActivity as luActivity,
  LuArrowUpRight as luArrowUpRight,
  LuCircleCheck as luCircleCheck,
  LuCircleHelp as luCircleHelp,
  LuCreditCard as luCreditCard,
  LuDumbbell as luDumbbell,
  LuPlus as luPlus,
  LuSearch as luSearch,
  LuSlidersHorizontal as luSlidersHorizontal,
  LuSwatchBook as luSwatchBook,
  LuUsers as luUsers,
} from 'react-icons/lu'
import * as components from '@/components'
import type { ShellUser } from '@/components/layout/siteHeader'
import type { DataTableColumn } from '@/components/ui/dataTable'
import { roleGroups } from '@/features/auth/model/authTypes'
import { useShellSession } from '@/features/auth/hooks/useShellSession'
import { toast } from '@/stores/toastStore'

interface DemoItem {
  id: number
  name: string
  category: string
  status: 'Disponible' | 'Mantenimiento'
}

const demoItems: DemoItem[] = [
  { id: 1, name: 'Mancuernas ajustables', category: 'Fuerza', status: 'Disponible' },
  { id: 2, name: 'Bicicleta estática', category: 'Cardio', status: 'Mantenimiento' },
  { id: 3, name: 'Bandas de resistencia', category: 'Accesorios', status: 'Disponible' },
  { id: 4, name: 'Caminadora', category: 'Cardio', status: 'Disponible' },
  { id: 5, name: 'Banco inclinado', category: 'Fuerza', status: 'Mantenimiento' },
]

const tableColumns: DataTableColumn<DemoItem>[] = [
  {
    key: 'name',
    header: 'Elemento',
    render: (item) => <span className="text-ink">{item.name}</span>,
  },
  {
    key: 'category',
    header: 'Categoría',
    render: (item) => item.category,
  },
  {
    key: 'status',
    header: 'Estado',
    render: (item) => (
      <components.status tone={item.status === 'Disponible' ? 'ok' : 'warn'}>
        {item.status}
      </components.status>
    ),
  },
]

const designShellUser: ShellUser = {
  name: 'Vista de diseño',
  initials: 'VD',
  role: 'Demostración',
  roles: roleGroups.all,
}

export const designPage = memo(() => {
  const shellSession = useShellSession()
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const pageSize = 2

  const filteredItems = useMemo(
    () =>
      demoItems.filter(
        (item) =>
          (!selectedCategory || item.category === selectedCategory) &&
          `${item.name} ${item.category}`
            .toLocaleLowerCase('es')
            .includes(searchText.toLocaleLowerCase('es')),
      ),
    [searchText, selectedCategory],
  )
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  const updateSearch = (value: string) => {
    setSearchText(value)
    setPage(1)
  }

  return (
    <components.appShell
      user={shellSession.user ?? designShellUser}
      onLogout={shellSession.onLogout}
    >
      <components.pageHead
        title="Sistema visual"
        icon={luSwatchBook}
        lede="Componentes, estados y temas de la interfaz de Olimpo."
        actions={
          <components.button
            variant="primary"
            icon={luCircleCheck}
            onClick={() => toast.success('Todo listo', 'El sistema visual responde correctamente.')}
          >
            Probar aviso
          </components.button>
        }
      />

      <div className="grid gap-8">
        <components.metricStrip>
          <components.metric icon={luSwatchBook} label="Temas" value="02" delta="Oscuro y claro" />
          <components.metric
            icon={luSlidersHorizontal}
            label="Primitivos"
            value="21"
            delta="Listos para reutilizar"
          />
          <components.metric icon={luActivity} label="Iconografía" value="1.7" delta="Trazo de línea" />
        </components.metricStrip>

        <components.panel>
          <components.panelHead
            icon={luSlidersHorizontal}
            title="Controles y estados"
            action={<components.tag>Componentes base</components.tag>}
          />
          <div className="grid gap-8 pt-5 md:grid-cols-2">
            <div className="grid content-start gap-5">
              <components.field label="Buscar componente" htmlFor="component-search">
                <components.searchInput
                  id="component-search"
                  placeholder="Nombre o categoría"
                  value={searchText}
                  onChange={(event) => updateSearch(event.currentTarget.value)}
                />
              </components.field>
              <components.field label="Filtrar por categoría" htmlFor="category-select">
                <components.select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(event) => {
                    setSelectedCategory(event.currentTarget.value)
                    setPage(1)
                  }}
                >
                  <option value="">Todas las categorías</option>
                  <option value="Fuerza">Fuerza</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Accesorios">Accesorios</option>
                </components.select>
              </components.field>
              <components.field label="Campo de texto" htmlFor="sample-input">
                <components.input id="sample-input" icon={luSearch} placeholder="Escribe algo…" />
              </components.field>
              <div className="flex flex-wrap items-center gap-2.5">
                <components.button
                  variant="primary"
                  icon={luPlus}
                  onClick={() => toast.success('Acción principal', 'La interacción de ejemplo funcionó.')}
                >
                  Acción principal
                </components.button>
                <components.button
                  onClick={() => toast.info('Acción secundaria', 'Este botón también responde al clic.')}
                >
                  Secundaria
                </components.button>
                <components.button
                  variant="quiet"
                  onClick={() => toast.info('Acción de texto', 'La variante discreta conserva su función.')}
                >
                  Texto
                </components.button>
                <components.button disabled>Deshabilitada</components.button>
                <components.iconButton
                  icon={luArrowUpRight}
                  label="Abrir detalle de ejemplo"
                  onClick={() => toast.info('Acción de ejemplo', 'El control con icono también es accesible.')}
                />
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <components.status tone="ok">Disponible</components.status>
                <components.status tone="warn">Por revisar</components.status>
                <components.status tone="danger">Inactivo</components.status>
                <components.tag>Sin relleno</components.tag>
              </div>
              <div className="flex items-center gap-3">
                <components.avatar size="sm">AR</components.avatar>
                <components.avatar>LM</components.avatar>
                <components.avatar size="lg">OP</components.avatar>
                <components.icon icon={luUsers} label="Usuarios" className="text-gold" />
                <components.meander className="w-24" />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <components.button icon={luDumbbell} onClick={() => setIsModalOpen(true)}>
                  Abrir modal
                </components.button>
                <components.button
                  variant="quiet"
                  icon={luCircleHelp}
                  onClick={() => toast.error('Ejemplo de error', 'Revisa los datos e inténtalo de nuevo.')}
                >
                  Probar error
                </components.button>
              </div>
            </div>

            <div className="border-t border-line pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8">
              <components.panelHead icon={luCreditCard} title="Filas de ejemplo" />
              <components.rows className="mt-2">
                <components.row
                  time="09:00"
                  title="Registro de membresía"
                  meta="Hoy · recepción"
                  end="Completado"
                />
                <components.row
                  time="10:30"
                  title="Actualización de perfil"
                  meta="Hoy · administrador"
                  end="Pendiente"
                />
              </components.rows>
            </div>
          </div>
        </components.panel>

        <components.panel>
          <components.panelHead
            icon={luDumbbell}
            title="Tabla y paginación"
            action={<span className="text-xs text-faint">Datos de demostración</span>}
          />
          {visibleItems.length > 0 ? (
            <>
              <components.dataTable
                columns={tableColumns}
                rows={visibleItems}
                getRowKey={(item) => item.id}
              />
              <components.pagination
                page={page}
                pageSize={pageSize}
                totalItems={filteredItems.length}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          ) : (
            <components.emptyState
              icon={luSearch}
              title="No encontramos elementos"
              description="Cambia el texto de búsqueda para ver resultados."
              className="py-8"
            />
          )}
        </components.panel>
      </div>

      <components.modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal de ejemplo"
        icon={luDumbbell}
        footer={
          <components.button variant="primary" onClick={() => setIsModalOpen(false)}>
            Entendido
          </components.button>
        }
      >
        <p className="text-sm text-muted">
          Este diálogo conserva el foco, se cierra con Escape y utiliza los tokens del tema activo.
        </p>
      </components.modal>
    </components.appShell>
  )
})
