// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { memo } from 'react'
import {
  LuArrowLeft as luArrowLeft,
  LuArrowRight as luArrowRight,
  LuColumns3 as luColumns3,
  LuMoon as luMoon,
  LuSun as luSun,
} from 'react-icons/lu'
import { Link as link } from 'react-router'
import * as iconComponents from '@/components/ui/icon'
import * as iconButtonComponents from '@/components/ui/iconButton'
import { useThemeStore } from '@/stores/themeStore'

const routerComponents = { link }

const publicNavLinks = [
  { label: 'Sobre Olimpo', hash: 'about' },
  { label: 'Servicios', hash: 'services' },
  { label: 'Planes', hash: 'pricing' },
]

interface PublicHeaderProps {
  /**
   * `home` keeps the in-page anchors of the landing. `inner` points the same
   * anchors back to the landing and swaps the CTA for a return link, so public
   * pages such as login share the exact same navigation.
   */
  variant?: 'home' | 'inner'
}

export const publicHeader = memo(({ variant = 'home' }: PublicHeaderProps) => {
  const themeMode = useThemeStore((state) => state.mode)
  const toggleTheme = useThemeStore((state) => state.toggle)
  const isInner = variant === 'inner'

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg">
      <div className="mx-auto grid min-h-[72px] w-[calc(100%-2.5rem)] max-w-[1180px] grid-cols-[auto_1fr_auto] items-center gap-7 sm:w-[calc(100%-4rem)] max-[900px]:grid-cols-[auto_1fr] max-[900px]:gap-x-5 max-[900px]:gap-y-0 max-[900px]:py-3 max-[640px]:gap-x-3">
        <routerComponents.link
          className="inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[0.18em] text-ink max-[640px]:text-[13px]"
          to="/"
          aria-label="Olimpo, inicio"
        >
          <iconComponents.icon icon={luColumns3} size="lg" className="text-gold" />
          <span>OLIMPO</span>
        </routerComponents.link>

        <nav
          className="flex items-center justify-center gap-[clamp(18px,3vw,42px)] text-[13px] text-muted max-[900px]:col-span-full max-[900px]:row-start-2 max-[900px]:justify-start max-[900px]:gap-7 max-[900px]:pt-3 max-[640px]:gap-6 max-[640px]:overflow-x-auto max-[640px]:whitespace-nowrap"
          aria-label="Navegación principal"
        >
          {publicNavLinks.map((navLink) =>
            isInner ? (
              <routerComponents.link
                key={navLink.hash}
                className="transition-colors hover:text-gold-strong"
                to={`/#${navLink.hash}`}
              >
                {navLink.label}
              </routerComponents.link>
            ) : (
              <a
                key={navLink.hash}
                className="transition-colors hover:text-gold-strong"
                href={`#${navLink.hash}`}
              >
                {navLink.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center justify-end gap-3.5 max-[900px]:col-start-2 max-[900px]:row-start-1 max-[640px]:gap-2">
          <iconButtonComponents.iconButton
            icon={themeMode === 'dark' ? luSun : luMoon}
            label={themeMode === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
            onClick={toggleTheme}
          />
          <routerComponents.link
            className="inline-flex min-h-10 items-center justify-center gap-2.5 rounded-control border border-line-strong px-[13px] text-[13px] font-medium leading-[1.3] text-ink transition-colors hover:border-gold hover:text-gold-strong max-[640px]:min-h-9 max-[640px]:px-[9px] max-[640px]:text-[11px]"
            to={isInner ? '/' : '/login'}
          >
            {isInner ? 'Volver al inicio' : 'Acceso al sistema'}
            <iconComponents.icon
              className="max-[640px]:hidden"
              icon={isInner ? luArrowLeft : luArrowRight}
              size="sm"
            />
          </routerComponents.link>
        </div>
      </div>
    </header>
  )
})
