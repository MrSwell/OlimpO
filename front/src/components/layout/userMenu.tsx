// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { useEffect, useRef, useState } from 'react'
import {
  LuChevronDown as luChevronDown,
  LuLogOut as luLogOut,
  LuMoon as luMoon,
  LuSun as luSun,
  LuSwatchBook as luSwatchBook,
} from 'react-icons/lu'
import { Link as link, NavLink as navLink, useLocation } from 'react-router'
import { cn } from '@/lib/cn'
import { useThemeStore } from '@/stores/themeStore'
import type { UserRole } from '@/features/auth/model/authTypes'
import { getRoleLabel } from '@/features/auth/model/roleLabels'
import * as iconComponents from '@/components/ui/icon'
import * as avatarComponents from '@/components/ui/avatar'
import type { ShellUser } from './siteHeader'
import { navItems } from './siteNav'

const routerComponents = { link, navLink }
const roleOrder: readonly UserRole[] = [
  'ADMIN',
  'RECEPCIONIST',
  'TRAINER_MANAGER',
  'TRAINER',
  'CLIENT',
]

interface UserMenuProps {
  user: ShellUser
  onLogout?: () => void
}

export const userMenu = ({ user, onLogout }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const mode = useThemeStore((state) => state.mode)
  const toggleTheme = useThemeStore((state) => state.toggle)
  const location = useLocation()
  const orderedRoles = roleOrder.filter((role) => user.roles.includes(role))

  const actionGroups = new Map<string, { roles: UserRole[]; items: typeof navItems }>()

  for (const item of navItems) {
    if (item.to === '/dashboard') continue

    const permittedRoles = orderedRoles.filter((role) => item.allowedRoles.includes(role))
    if (permittedRoles.length === 0) continue

    const groupKey = permittedRoles.join('|')
    const existingGroup = actionGroups.get(groupKey)

    if (existingGroup) {
      existingGroup.items.push(item)
    } else {
      actionGroups.set(groupKey, { roles: permittedRoles, items: [item] })
    }
  }

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setIsOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const dashboardItem = navItems.find((item) => item.to === '/dashboard')
  const closeMenu = () => setIsOpen(false)
  const roleGroups = [...actionGroups.values()]

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="user-actions-menu"
        aria-label={`${user.name}, ${user.role}. ${isOpen ? 'Cerrar' : 'Abrir'} menú de usuario`}
        onClick={() => setIsOpen((open) => !open)}
        className="group inline-flex min-h-10 max-w-[min(72vw,340px)] items-center gap-2.5 rounded-control border border-transparent px-2 py-1.5 text-left transition-colors hover:border-line-strong focus-visible:border-gold"
      >
        <avatarComponents.avatar>{user.initials}</avatarComponents.avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-ink">{user.name}</span>
          <span className="block truncate text-[11px] text-muted">{user.role}</span>
        </span>
        <iconComponents.icon
          icon={luChevronDown}
          size="sm"
          className={cn('text-faint transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          id="user-actions-menu"
          className="absolute right-0 top-[calc(100%+10px)] z-40 max-h-[min(70vh,560px)] w-[min(340px,calc(100vw-2rem))] overflow-y-auto rounded-control border border-line-strong bg-panel p-2 shadow-[var(--shadow-pop)]"
        >
          <nav aria-label="Acciones de usuario">
            {dashboardItem && (
              <routerComponents.navLink
                to={dashboardItem.to}
                end
                onClick={closeMenu}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2.5 rounded-control px-3 py-2.5 text-[13px] transition-colors hover:bg-panel-2',
                    isActive ? 'text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <iconComponents.icon
                      icon={dashboardItem.icon}
                      size="sm"
                      className={isActive ? 'text-gold' : 'text-faint group-hover:text-gold'}
                    />
                    Panel
                  </>
                )}
              </routerComponents.navLink>
            )}

            {roleGroups.map((group) => (
              <section key={group.roles.join('-')} className="mt-2 border-t border-line pt-2">
                <h2 className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
                  {group.roles.map((role) => getRoleLabel([role])).join(' · ')}
                </h2>
                {group.items.map((item) => (
                  <routerComponents.navLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-2.5 rounded-control px-3 py-2 text-[12.5px] transition-colors hover:bg-panel-2',
                        isActive ? 'text-ink' : 'text-muted hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <iconComponents.icon
                          icon={item.icon}
                          size="sm"
                          className={isActive ? 'text-gold' : 'text-faint group-hover:text-gold'}
                        />
                        {item.label}
                      </>
                    )}
                  </routerComponents.navLink>
                ))}
              </section>
            ))}

            {orderedRoles.length > 0 && roleGroups.length === 0 && (
              <p className="border-t border-line px-3 py-3 text-[12px] leading-5 text-faint">
                Aún no hay otras acciones disponibles para tu rol.
              </p>
            )}
          </nav>

          <div className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-[12.5px] text-muted transition-colors hover:bg-panel-2 hover:text-ink"
            >
              <iconComponents.icon
                icon={mode === 'dark' ? luSun : luMoon}
                size="sm"
                className="text-faint"
              />
              Usar tema {mode === 'dark' ? 'claro' : 'oscuro'}
            </button>
            {import.meta.env.DEV && (
              <routerComponents.link
                to="/design"
                onClick={closeMenu}
                className="flex items-center gap-2.5 rounded-control px-3 py-2 text-[12.5px] text-muted transition-colors hover:bg-panel-2 hover:text-ink"
              >
                <iconComponents.icon icon={luSwatchBook} size="sm" className="text-faint" />
                Diseño
              </routerComponents.link>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  onLogout()
                }}
                className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-[12.5px] text-muted transition-colors hover:bg-panel-2 hover:text-ink"
              >
                <iconComponents.icon icon={luLogOut} size="sm" className="text-faint" />
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
