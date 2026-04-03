const PARTICIPANT_ROLE_LABELS: Record<string, string> = {
  product_designer: 'Product Designer',
  ux_ui_designer: 'UX/UI Designer',
  ux_ui: 'UX/UI Designer',
  frontend_developer: 'Frontend Developer',
  frontend: 'Frontend Developer',
  backend_developer: 'Backend Developer',
  backend: 'Backend Developer',
  qa_tester: 'QA Tester',
  qa: 'QA Tester',
  product_manager: 'Product Manager',
  project_manager: 'Project Manager',
  data_analyst: 'Data Analyst',
  analista_funcional: 'Analista Funcional',
  no_code: 'No-Code Developer',
}

function normalizeRoleKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
    .replace(/_+/g, '_')
}

function tokenToReadable(token: string): string {
  if (token === 'qa') return 'QA'
  if (token === 'ux') return 'UX'
  if (token === 'ui') return 'UI'
  if (token === 'pm') return 'PM'
  if (!token) return ''
  return token.charAt(0).toUpperCase() + token.slice(1)
}

function roleFallbackLabel(role: string): string {
  const tokens = normalizeRoleKey(role)
    .split('_')
    .filter(Boolean)
    .map(tokenToReadable)

  if (tokens.length === 0) return 'Sin rol asignado'

  const merged: string[] = []
  for (let index = 0; index < tokens.length; index += 1) {
    const current = tokens[index]
    const next = tokens[index + 1]

    if (current === 'UX' && next === 'UI') {
      merged.push('UX/UI')
      index += 1
      continue
    }

    merged.push(current)
  }

  return merged.join(' ')
}

export function participantRoleLabel(
  role: string | null | undefined,
  emptyLabel = 'Sin rol asignado'
): string {
  const raw = (role ?? '').trim()
  if (!raw) return emptyLabel

  const normalized = normalizeRoleKey(raw)
  return PARTICIPANT_ROLE_LABELS[normalized] ?? roleFallbackLabel(normalized)
}

