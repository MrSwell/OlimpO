import type { MembershipType } from './clientTypes'

export interface MembershipProgress {
  state: 'upcoming' | 'active' | 'expired'
  percentageRemaining: number
  daysRemaining: number
  daysUntilStart: number
  daysOverdue: number
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const formatMoney = (amount: number): string => currencyFormatter.format(amount)

export const formatDate = (value: string | null): string => {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}

export const getLocalDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getMembershipDurationDays = (type: MembershipType): number => {
  if (type === 'DAILY') return 1
  if (type === 'QUARTERLY') return 15
  return 30
}

export const addDaysToLocalDate = (value: string, days: number): string => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

export const getRenewalDates = (
  currentEndDate: string,
  type: MembershipType,
  today = getLocalDate(),
): { baseDate: string; renewedEndDate: string } => {
  const baseDate = currentEndDate < today ? today : currentEndDate
  return {
    baseDate,
    renewedEndDate: addDaysToLocalDate(baseDate, getMembershipDurationDays(type)),
  }
}

const localDateNumber = (value: string): number => {
  const [year, month, day] = value.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

export const getMembershipProgress = (
  startDate: string,
  endDate: string,
  today = getLocalDate(),
): MembershipProgress => {
  const start = localDateNumber(startDate)
  const end = localDateNumber(endDate)
  const current = localDateNumber(today)
  const daysUntilStart = Math.max(0, start - current)
  const daysUntilEnd = end - current
  const totalDays = Math.max(1, end - start)

  if (start > current) {
    return {
      state: 'upcoming',
      percentageRemaining: 100,
      daysRemaining: daysUntilEnd,
      daysUntilStart,
      daysOverdue: 0,
    }
  }

  if (daysUntilEnd < 0) {
    return {
      state: 'expired',
      percentageRemaining: 0,
      daysRemaining: 0,
      daysUntilStart: 0,
      daysOverdue: Math.abs(daysUntilEnd),
    }
  }

  return {
    state: 'active',
    percentageRemaining: Math.round((daysUntilEnd / totalDays) * 100),
    daysRemaining: daysUntilEnd,
    daysUntilStart: 0,
    daysOverdue: 0,
  }
}
