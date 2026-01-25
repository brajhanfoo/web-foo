import type { ApplicationFormSchema, FormField } from './form-types'

export type FormAnswers = Record<string, any>

export function validateAnswers(
  schema: ApplicationFormSchema,
  answers: FormAnswers
) {
  const errors: Record<string, string> = {}

  for (const f of schema.fields) {
    if (!f.required) continue

    const v = answers[f.id]

    const empty =
      v === null ||
      v === undefined ||
      (typeof v === 'string' && v.trim() === '') ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === 'boolean' && v === false && f.type !== 'checkbox')

    // Para checkbox required: debe ser true
    if (f.type === 'checkbox') {
      if (v !== true) errors[f.id] = 'Este campo es obligatorio.'
      continue
    }

    if (empty) errors[f.id] = 'Este campo es obligatorio.'
  }

  return errors
}

export function getDefaultAnswers(schema: ApplicationFormSchema): FormAnswers {
  const a: FormAnswers = {}
  for (const f of schema.fields) {
    switch (f.type) {
      case 'multiselect':
        a[f.id] = []
        break
      case 'checkbox':
        a[f.id] = false
        break
      default:
        a[f.id] = ''
    }
  }
  return a
}

export function normalizeSchema(input: any): ApplicationFormSchema {
  // fallback seguro
  const schema: ApplicationFormSchema = {
    version: 'v1',
    title: input?.title ?? null,
    description: input?.description ?? null,
    fields: Array.isArray(input?.fields) ? input.fields : [],
  }

  // saneo de opciones
  schema.fields = schema.fields.map((f: FormField) => {
    if (
      (f.type === 'select' || f.type === 'multiselect') &&
      !Array.isArray((f as any).options)
    ) {
      return { ...(f as any), options: [] }
    }
    return f
  })

  return schema
}
