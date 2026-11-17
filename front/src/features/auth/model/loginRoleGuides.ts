import type { IconType } from 'react-icons'
import {
  LuClipboardList as luClipboardList,
  LuDumbbell as luDumbbell,
  LuShieldCheck as luShieldCheck,
  LuUserRound as luUserRound,
} from 'react-icons/lu'

export type LoginRoleId = 'CLIENT' | 'RECEPCIONIST' | 'TRAINER' | 'ADMIN'

export interface LoginRoleGuide {
  role: LoginRoleId
  label: string
  icon: IconType
  summary: string
  tips: string[]
}

export const loginRoleGuides: LoginRoleGuide[] = [
  {
    role: 'CLIENT',
    label: 'Cliente',
    icon: luUserRound,
    summary: 'Tu espacio personal',
    tips: [
      'Tu membresía y su fecha de vencimiento',
      'Las rutinas que te asignó tu entrenador',
      'Tus pagos registrados',
    ],
  },
  {
    role: 'RECEPCIONIST',
    label: 'Recepción',
    icon: luClipboardList,
    summary: 'Atención y cobros',
    tips: [
      'Alta y renovación de clientes',
      'Registro de pagos y comprobantes',
      'Membresías próximas a vencer',
    ],
  },
  {
    role: 'TRAINER',
    label: 'Entrenador',
    icon: luDumbbell,
    summary: 'Rutinas y horarios',
    tips: [
      'Tu horario semanal',
      'Rutinas y asignaciones',
      'Inventario y máquinas',
    ],
  },
  {
    role: 'ADMIN',
    label: 'Administración',
    icon: luShieldCheck,
    summary: 'Vista completa',
    tips: [
      'Usuarios y roles',
      'Panel completo del gimnasio',
      'Pagos, inventario y horarios',
    ],
  },
]
