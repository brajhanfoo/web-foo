export type AuthErrorCode =
  | 'invalid-credentials'
  | 'user-not-found'
  | 'rate-limit'
  | 'email-not-confirmed'
  | 'user-exists'
  | 'unknown'

export type AuthErrorContext = 'login' | 'signup' | 'resend'

export type AuthErrorTranslation = {
  code: AuthErrorCode
  title: string
  description?: string
}

type ErrorLike = {
  message?: unknown
  status?: unknown
  code?: unknown
}

function normalizeAuthError(error: unknown) {
  if (!error) {
    return { message: '', status: undefined as number | undefined, code: '' }
  }

  if (typeof error === 'string') {
    return { message: error, status: undefined as number | undefined, code: '' }
  }

  if (error instanceof Error) {
    const candidate = error as ErrorLike
    const status =
      typeof candidate.status === 'number' ? candidate.status : undefined
    const code = typeof candidate.code === 'string' ? candidate.code : ''
    return { message: error.message, status, code }
  }

  if (typeof error === 'object') {
    const candidate = error as ErrorLike
    const message =
      typeof candidate.message === 'string'
        ? candidate.message
        : ''
    const status =
      typeof candidate.status === 'number' ? candidate.status : undefined
    const code = typeof candidate.code === 'string' ? candidate.code : ''
    return { message, status, code }
  }

  return { message: '', status: undefined as number | undefined, code: '' }
}

function fallbackForContext(context: AuthErrorContext): AuthErrorTranslation {
  switch (context) {
    case 'signup':
      return {
        code: 'unknown',
        title: 'No se pudo crear la cuenta.',
        description: 'Intenta nuevamente.',
      }
    case 'resend':
      return {
        code: 'unknown',
        title: 'No se pudo reenviar el correo.',
        description: 'Intenta nuevamente.',
      }
    case 'login':
    default:
      return {
        code: 'unknown',
        title: 'No se pudo iniciar sesión. Intenta nuevamente.',
      }
  }
}

export function mapSupabaseAuthErrorToEs(
  error: unknown,
  context: AuthErrorContext = 'login'
): AuthErrorTranslation {
  const { message, status, code } = normalizeAuthError(error)
  const normalizedMessage = message.toLowerCase()
  const normalizedCode = code.toLowerCase()

  const has = (value: string) => normalizedMessage.includes(value)
  const codeHas = (value: string) => normalizedCode.includes(value)

  if (
    has('invalid login credentials') ||
    codeHas('invalid_credentials') ||
    codeHas('invalid_login')
  ) {
    return {
      code: 'invalid-credentials',
      title: 'Correo o contraseña incorrectos.',
    }
  }

  if (has('user not found') || codeHas('user_not_found')) {
    return {
      code: 'user-not-found',
      title: 'La cuenta no existe. Regístrate primero.',
    }
  }

  if (
    has('email not confirmed') ||
    has('email not verified') ||
    codeHas('email_not_confirmed') ||
    codeHas('email_not_verified')
  ) {
    return {
      code: 'email-not-confirmed',
      title: 'Cuenta no verificada',
      description:
        'Confirma tu correo para poder iniciar sesión. Revisa tu bandeja de entrada o spam.',
    }
  }

  if (
    status === 429 ||
    has('too many requests') ||
    has('rate limit') ||
    codeHas('too_many_requests') ||
    codeHas('rate_limit')
  ) {
    return {
      code: 'rate-limit',
      title: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
    }
  }

  if (
    has('already registered') ||
    has('already exists') ||
    has('user already') ||
    has('email already') ||
    codeHas('user_already_exists')
  ) {
    return {
      code: 'user-exists',
      title: 'Ya estás registrado',
      description:
        'Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.',
    }
  }

  return fallbackForContext(context)
}
