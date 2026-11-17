import { z } from 'zod'

export const loginFormSchema = z.object({
  email: z.string().trim().email('Ingresa un correo válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
