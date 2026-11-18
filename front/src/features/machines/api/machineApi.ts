import { apiRequest } from '@/lib/apiClient'
import {
  machineSchema,
  machinesPageSchema,
  type Machine,
  type MachinesPage,
  type MachineStatusFilter,
} from '../model/machineTypes'

export interface MachinePayload {
  name: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  status: Machine['status']
}

export interface MachineListOptions {
  page: number
  size: number
  search: string
  status: MachineStatusFilter
}

export const createMachineQuery = (options: MachineListOptions): string => {
  const params = new URLSearchParams({
    page: String(options.page),
    size: String(options.size),
  })

  if (options.search) params.set('search', options.search)
  if (options.status !== 'ALL') params.set('status', options.status)
  return params.toString()
}

export const getMachines = async (options: MachineListOptions): Promise<MachinesPage> => {
  const response = await apiRequest<unknown>(`/machines?${createMachineQuery(options)}`)
  return machinesPageSchema.parse(response)
}

export const getMachine = async (machineId: number): Promise<Machine> => {
  const response = await apiRequest<unknown>(`/machines/${machineId}`)
  return machineSchema.parse(response)
}

export const createMachine = async (payload: MachinePayload): Promise<Machine> => {
  const response = await apiRequest<unknown>('/machines', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return machineSchema.parse(response)
}

export const updateMachine = async (
  machineId: number,
  payload: MachinePayload,
): Promise<Machine> => {
  const response = await apiRequest<unknown>(`/machines/${machineId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return machineSchema.parse(response)
}
