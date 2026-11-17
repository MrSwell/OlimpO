// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { memo } from 'react'
import {
  LuColumns3 as luColumns3,
  LuMoon as luMoon,
  LuSun as luSun,
  LuSwatchBook as luSwatchBook,
} from 'react-icons/lu'
import { Link as link } from 'react-router'
import * as iconComponents from '@/components/ui/icon'
import * as iconButtonComponents from '@/components/ui/iconButton'
import { useThemeStore } from '@/stores/themeStore'
import * as userMenuComponents from './userMenu'
import type { UserRole } from '@/features/auth/model/authTypes'

const routerComponents = { link }

export interface ShellUser {
  name: string
  initials: string
  role: string
  roles: readonly UserRole[]
}

interface SiteHeaderProps {
  user?: ShellUser
  onLogout?: () => void
}

export const siteHeader = memo(({ user, onLogout }: SiteHeaderProps) => {
  const mode = useThemeStore((state) => state.mode)
  const toggle = useThemeStore((state) => state.toggle)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg">
      <div className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center gap-5 px-6 min-[821px]:px-8 min-[1021px]:gap-9">
        <routerComponents.link to="/" className="inline-flex items-center gap-2.5 text-ink">
          <iconComponents.icon icon={luColumns3} size="lg" className="text-gold" />
          <strong className="text-[15px] font-semibold tracking-[0.18em]">OLIMPO</strong>
        </routerComponents.link>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {import.meta.env.DEV && (
            !user && (
              <routerComponents.link
                to="/design"
                className="hidden items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-gold-strong sm:inline-flex"
              >
                <iconComponents.icon icon={luSwatchBook} size="sm" />
                Diseño
              </routerComponents.link>
            )
          )}

          {user ? (
            <userMenuComponents.userMenu user={user} onLogout={onLogout} />
          ) : (
            <>
              <span className="hidden text-[12.5px] text-faint sm:inline">
                Sesión no iniciada
              </span>
              <iconButtonComponents.iconButton
                icon={mode === 'dark' ? luSun : luMoon}
                label={mode === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
                onClick={toggle}
                variant="outline"
              />
            </>
          )}
        </div>
      </div>
    </header>
  )
})
