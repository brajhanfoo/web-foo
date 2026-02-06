import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'La contrasena debe tener al menos 8 caracteres.')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayuscula.')
  .regex(/[0-9]/, 'Debe incluir al menos un numero.')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un simbolo.')

export function getPasswordError(password: string): string | null {
  const result = passwordSchema.safeParse(password)
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'Contraseña inválida.'
}
