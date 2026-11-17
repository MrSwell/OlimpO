import type { UserRole } from './authTypes'

export const getRoleLabel = (roles: readonly UserRole[]): string => {
  if (roles.includes('ADMIN')) return 'Administrador'
  if (roles.includes('RECEPCIONIST')) return 'Recepción'
  if (roles.includes('TRAINER_MANAGER')) return 'Coordinación'
  if (roles.includes('TRAINER')) return 'Entrenador'
  if (roles.includes('CLIENT')) return 'Cliente'
  return 'Usuario'
}
