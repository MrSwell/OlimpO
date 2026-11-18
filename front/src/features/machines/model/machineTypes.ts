import { z } from 'zod'

export const machineStatusSchema = z.enum(['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'])

export const machineSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  serialNumber: z.string().nullable(),
  status: machineStatusSchema,
})

const pageResponseSchema = <T extends z.ZodType>(contentSchema: T) =>
  z.object({
    content: z.array(contentSchema),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })

export const machinesPageSchema = pageResponseSchema(machineSchema)

export type Machine = z.infer<typeof machineSchema>
export type MachinesPage = z.infer<typeof machinesPageSchema>
export type MachineStatus = z.infer<typeof machineStatusSchema>

export type MachineStatusFilter = MachineStatus | 'ALL'

export const machineStatusLabels: Record<MachineStatus, string> = {
  AVAILABLE: 'Disponible',
  MAINTENANCE: 'Mantenimiento',
  OUT_OF_SERVICE: 'Fuera de servicio',
}

export const machineStatuses: MachineStatus[] = [
  'AVAILABLE',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
]
