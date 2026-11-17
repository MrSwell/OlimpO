import * as meanderComponents from '@/components/ui/meander'

export const siteFooter = () => {
  return (
    <footer className="mx-auto flex w-full max-w-[1180px] items-center gap-4 px-6 pb-8 text-xs text-faint min-[821px]:px-8">
      <meanderComponents.meander className="w-24" />
      <span>Olimpo · gestión del gimnasio</span>
    </footer>
  )
}
