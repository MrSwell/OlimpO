// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import type { IconType } from 'react-icons'
import {
  LuCalendarDays as luCalendarDays,
  LuLayoutGrid as luLayoutGrid,
  LuPackage as luPackage,
  LuReceipt as luReceipt,
  LuUsers as luUsers,
} from 'react-icons/lu'
import { roleGroups, type UserRole } from '@/features/auth/model/authTypes'

export interface NavItem {
  to: string
  label: string
  icon: IconType
  end?: boolean
  allowedRoles: readonly UserRole[]
  group?: 'administration'
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: luLayoutGrid, end: true, allowedRoles: roleGroups.all },
  { to: '/clients', label: 'Clientes', icon: luUsers, allowedRoles: roleGroups.clientManagement },
  { to: '/payments', label: 'Pagos', icon: luReceipt, allowedRoles: roleGroups.clientManagement },
  {
    to: '/inventory',
    label: 'Inventario',
    icon: luPackage,
    allowedRoles: roleGroups.trainingStaff,
  },
  {
    to: '/schedules',
    label: 'Horarios',
    icon: luCalendarDays,
    allowedRoles: roleGroups.trainingStaff,
  },
  { to: '/users', label: 'Usuarios', icon: luUsers, allowedRoles: ['ADMIN'], group: 'administration' },
]
