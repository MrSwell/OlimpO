import type { ReactNode } from 'react'
import * as publicHeaderComponents from './publicHeader'
import * as siteFooterComponents from './siteFooter'
import * as siteHeaderComponents from './siteHeader'
import type { ShellUser } from './siteHeader'

interface AppShellProps {
  children: ReactNode
  user?: ShellUser
  onLogout?: () => void
}

export const appShell = ({ children, user, onLogout }: AppShellProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:border focus:border-gold-border focus:bg-panel focus:px-3 focus:py-2 focus:text-[13px] focus:text-ink"
      >
        Saltar al contenido
      </a>
      {user ? (
        <siteHeaderComponents.siteHeader user={user} onLogout={onLogout} />
      ) : (
        <publicHeaderComponents.publicHeader variant="inner" />
      )}
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1180px] flex-1 px-6 pt-10 pb-14 min-[821px]:px-8 min-[821px]:pt-14 min-[821px]:pb-[72px]"
      >
        {children}
      </main>
      <siteFooterComponents.siteFooter />
    </div>
  )
}
