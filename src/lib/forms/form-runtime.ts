import type { ApplicationFormSchema, FormField } from './form-types'

export type FormAnswers = Record<string, string | string[] | boolean | null>

export function validateAnswers(
  schema: ApplicationFormSchema,
  answers: FormAnswers
) {
  const errors: Record<string, string> = {}

  for (const field of schema.fields) {
    if (!field.required) continue

    const value = answers[field.id]

    const empty =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'boolean' && value === false && field.type !== 'checkbox')

    // Para checkbox required: debe ser true
    if (field.type === 'checkbox') {
      if (value !== true) errors[field.id] = 'Este campo es obligatorio.'
      continue
    }

    if (empty) errors[field.id] = 'Este campo es obligatorio.'
  }

  return errors
}

export function getDefaultAnswers(schema: ApplicationFormSchema): FormAnswers {
  const answers: FormAnswers = {}
  for (const field of schema.fields) {
    switch (field.type) {
      case 'multiselect':
        answers[field.id] = []
        break
      case 'checkbox':
        answers[field.id] = false
        break
      default:
        answers[field.id] = ''
    }
  }
  return answers
}

// Type guard para verificar si un valor desconocido es un FormField válido
function isFormField(field: unknown): field is FormField {
  if (typeof field !== 'object' || field === null) return false
  
  const fieldObject = field as Record<string, unknown>
  
  // Verificar propiedades base requeridas
  if (typeof fieldObject.id !== 'string') return false
  if (typeof fieldObject.label !== 'string') return false
  if (typeof fieldObject.type !== 'string') return false
  
  const validTypes = ['text', 'textarea', 'number', 'select', 'multiselect', 'date', 'checkbox']
  if (!validTypes.includes(fieldObject.type as string)) return false
  
  // Para select y multiselect, verificar que options sea un array
  if (fieldObject.type === 'select' || fieldObject.type === 'multiselect') {
    if (!Array.isArray(fieldObject.options)) return false
  }
  
  return true
}

export function normalizeSchema(input: unknown): ApplicationFormSchema {
  // Type guard para el input
  const isValidInput = (value: unknown): value is {
    title?: string | null
    description?: string | null
    fields?: unknown[]
  } => {
    return typeof value === 'object' && value !== null
  }

  const validInput = isValidInput(input) ? input : {}

  // Filtrar y validar los campos
  const rawFields = Array.isArray(validInput.fields) ? validInput.fields : []
  const validFields: FormField[] = rawFields
    .filter(isFormField)
    .map((field: FormField) => {
      // Asegurar que select/multiselect tengan options
      if (field.type === 'select' || field.type === 'multiselect') {
        const hasValidOptions = Array.isArray(field.options) && field.options.length > 0
        return hasValidOptions ? field : { ...field, options: [] }
      }
      return field
    })

  // Construir schema final
  const schema: ApplicationFormSchema = {
    version: 'v1',
    title: validInput.title ?? null,
    description: validInput.description ?? null,
    fields: validFields,
  }

  return schema
}