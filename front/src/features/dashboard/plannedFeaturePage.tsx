import * as componentComponents from '@/components'

interface PlannedFeaturePageProps {
  title: string
  phase: string
  description: string
}

export const plannedFeaturePage = ({ title, phase, description }: PlannedFeaturePageProps) => {
  return (
    <>
      <componentComponents.pageHead title={title} lede={description} />
      <componentComponents.panel>
        <componentComponents.emptyState
          title="Módulo en preparación"
          description={`Esta sección se habilitará en ${phase}.`}
        />
      </componentComponents.panel>
    </>
  )
}
