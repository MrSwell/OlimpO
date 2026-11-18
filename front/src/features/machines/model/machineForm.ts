import { z } from 'zod'
import { machineStatusSchema } from './machineTypes'

export const machineFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre.').max(150, 'El nombre no puede superar 150 caracteres.'),
  brand: z.string().trim().max(100, 'La marca no puede superar 100 caracteres.'),
  model: z.string().trim().max(100, 'El modelo no puede superar 100 caracteres.'),
  serialNumber: z
    .string()
    .trim()
    .max(100, 'El número de serie no puede superar 100 caracteres.'),
  status: machineStatusSchema,
})

export type MachineFormValues = z.infer<typeof machineFormSchema>
