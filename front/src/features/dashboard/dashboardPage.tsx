import * as componentComponents from '@/components'

export const dashboardPage = () => {
  return (
    <>
      <componentComponents.pageHead
        title="Panel"
        lede="Un punto de partida claro para la gestión de Olimpo."
      />
      <componentComponents.panel>
        <componentComponents.emptyState
          title="Tu espacio de gestión está listo"
          description="Los indicadores y operaciones del panel se incorporarán en las siguientes fases."
        />
      </componentComponents.panel>
    </>
  )
}
