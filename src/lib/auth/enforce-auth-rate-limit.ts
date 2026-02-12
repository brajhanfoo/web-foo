import 'server-only'

import { supabaseAdmin } from '@/lib/supabase/admin'

export type AuthRateLimitAction =
  | 'resend_confirmation'
  | 'reset_password'
  | 'login_attempt'

export type AuthRateLimitResult = {
  allowed: boolean
  retryAfterSeconds?: number
}

type AuthSecurityEventResult =
  | 'attempt'
  | 'blocked'
  | 'sent'
  | 'error'
  | 'invalid'
  | 'allowed'

type EnforceAuthRateLimitArgs = {
  action: AuthRateLimitAction
  ip: string
  email?: string
  userAgent?: string
}

type LimitRule = {
  name: 'ip' | 'email' | 'global_ip'
  key: string
  max: number
  windowSeconds: number
}

type RateLimitConfig = {
  resendConfirmation: {
    ip: { max: number; windowSeconds: number }
    email: { max: number; windowSeconds: number }
    globalIp: { max: number; windowSeconds: number }
    blockSeconds: number
  }
  resetPassword: {
    ip: { max: number; windowSeconds: number }
    email: { max: number; windowSeconds: number }
    blockSeconds: number
  }
  loginAttempt: {
    ip: { max: number; windowSeconds: number }
    email: { max: number; windowSeconds: number }
    blockSeconds: [number, number, number]
  }
}

type AuthSecurityEventInsert = {
  action: AuthRateLimitAction
  email: string | null
  email_norm: string | null
  ip: string | null
  user_agent: string | null
  result: AuthSecurityEventResult
  meta: Record<string, unknown>
}

function readEnvNumber(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return fallback
  return value
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  resendConfirmation: {
    ip: {
      max: readEnvNumber('AUTH_RATE_RESEND_CONFIRMATION_IP_MAX', 5),
      windowSeconds: readEnvNumber(
        'AUTH_RATE_RESEND_CONFIRMATION_IP_WINDOW_SECONDS',
        10 * 60
      ),
    },
    email: {
      max: readEnvNumber('AUTH_RATE_RESEND_CONFIRMATION_EMAIL_MAX', 3),
      windowSeconds: readEnvNumber(
        'AUTH_RATE_RESEND_CONFIRMATION_EMAIL_WINDOW_SECONDS',
        30 * 60
      ),
    },
    globalIp: {
      max: readEnvNumber('AUTH_RATE_RESEND_CONFIRMATION_GLOBAL_IP_MAX', 20),
      windowSeconds: readEnvNumber(
        'AUTH_RATE_RESEND_CONFIRMATION_GLOBAL_IP_WINDOW_SECONDS',
        60 * 60
      ),
    },
    blockSeconds: readEnvNumber(
      'AUTH_RATE_RESEND_CONFIRMATION_BLOCK_SECONDS',
      20 * 60
    ),
  },
  resetPassword: {
    ip: {
      max: readEnvNumber('AUTH_RATE_RESET_PASSWORD_IP_MAX', 5),
      windowSeconds: readEnvNumber(
        'AUTH_RATE_RESET_PASSWORD_IP_WINDOW_SECONDS',
        10 * 60
      ),
    },
    email: {
      max: readEnvNumber('AUTH_RATE_RESET_PASSWORD_EMAIL_MAX', 2),
      windowSeconds: readEnvNumber(
        'AUTH_RATE_RESET_PASSWORD_EMAIL_WINDOW_SECONDS',
        30 * 60
      ),
    },
    blockSeconds: readEnvNumber(
      'AUTH_RATE_RESET_PASSWORD_BLOCK_SECONDS',
      30 * 60
    ),
  },
  loginAttempt: {
    ip: {
      max: readEnvNumber('AUTH_RATE_LOGIN_ATTEMPT_IP_MAX', 5),
      windowSeconds: readEnvNumber(
        'AUTH_RATE_LOGIN_ATTEMPT_IP_WINDOW_SECONDS',
        10 * 60
      ),
    },
    email: {
      max: readEnvNumber('AUTH_RATE_LOGIN_ATTEMPT_EMAIL_MAX', 5),
      windowSeconds: readEnvNumber(
        'AUTH_RATE_LOGIN_ATTEMPT_EMAIL_WINDOW_SECONDS',
        15 * 60
      ),
    },
    blockSeconds: [
      readEnvNumber('AUTH_RATE_LOGIN_ATTEMPT_BLOCK_SECONDS_1', 15 * 60),
      readEnvNumber('AUTH_RATE_LOGIN_ATTEMPT_BLOCK_SECONDS_2', 60 * 60),
      readEnvNumber('AUTH_RATE_LOGIN_ATTEMPT_BLOCK_SECONDS_3', 24 * 60 * 60),
    ],
  },
}

function normalizeEmail(email?: string) {
  const trimmed = email?.trim() ?? ''
  if (!trimmed) return ''
  return trimmed.toLowerCase()
}

function normalizeIp(ip?: string) {
  const trimmed = ip?.trim() ?? ''
  return trimmed || 'unknown'
}

function normalizeUserAgent(userAgent?: string) {
  const trimmed = userAgent?.trim() ?? ''
  return trimmed || null
}

function buildKeys(action: AuthRateLimitAction, ip: string, email: string) {
  const normalizedIp = normalizeIp(ip)
  const ipKey = `ip:${normalizedIp}`
  const emailKey = email ? `email:${email}` : ''
  const ipEmailKey = email ? `ip_email:${normalizedIp}|${email}` : ''
  const globalIpKey =
    action === 'resend_confirmation' ? `global_ip:${normalizedIp}` : ''

  const keys = [ipKey, emailKey, ipEmailKey, globalIpKey].filter(
    (value) => value.length > 0
  )

  return {
    ipKey,
    emailKey,
    ipEmailKey,
    globalIpKey,
    keys,
  }
}

function buildBlockKey(action: AuthRateLimitAction, rawKey: string) {
  return `${action}:${rawKey}`
}

async function insertAuthSecurityEvents(events: AuthSecurityEventInsert[]) {
  if (events.length === 0) return

  try {
    await supabaseAdmin.from('auth_security_events').insert(events)
  } catch {
    // Avoid blocking auth flows if telemetry fails.
  }
}

function parseRetryAfterSeconds(blockedUntil: string, nowMs: number) {
  const targetMs = Date.parse(blockedUntil)
  if (!Number.isFinite(targetMs)) return null
  const deltaMs = targetMs - nowMs
  if (deltaMs <= 0) return null
  return Math.max(1, Math.ceil(deltaMs / 1000))
}

async function countEventsForRule(
  action: AuthRateLimitAction,
  rule: LimitRule,
  ip: string,
  emailNorm: string,
  windowSeconds: number
) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString()

  let query = supabaseAdmin
    .from('auth_security_events')
    .select('id', { count: 'exact', head: true })
    .eq('action', action)
    .eq('result', 'attempt')
    .gte('created_at', since)

  if (rule.name === 'email') {
    if (!emailNorm) return 0
    query = query.eq('email_norm', emailNorm)
  } else {
    query = query.eq('ip', ip)
  }

  const { count } = await query

  return typeof count === 'number' ? count : 0
}

async function countBlockedEventsForKey(
  action: AuthRateLimitAction,
  blockKey: string
) {
  const { count } = await supabaseAdmin
    .from('auth_security_events')
    .select('id', { count: 'exact', head: true })
    .eq('action', action)
    .eq('result', 'blocked')
    .eq('meta->>reason', 'limit_exceeded')
    .eq('meta->>block_key', blockKey)

  return typeof count === 'number' ? count : 0
}

function resolveLoginBlockSeconds(previousBlocks: number) {
  if (previousBlocks <= 0) return RATE_LIMIT_CONFIG.loginAttempt.blockSeconds[0]
  if (previousBlocks === 1)
    return RATE_LIMIT_CONFIG.loginAttempt.blockSeconds[1]
  return RATE_LIMIT_CONFIG.loginAttempt.blockSeconds[2]
}

function buildLimitRules(
  action: AuthRateLimitAction,
  keys: ReturnType<typeof buildKeys>
) {
  const rules: LimitRule[] = []

  if (action === 'resend_confirmation') {
    rules.push({
      name: 'ip',
      key: keys.ipKey,
      max: RATE_LIMIT_CONFIG.resendConfirmation.ip.max,
      windowSeconds: RATE_LIMIT_CONFIG.resendConfirmation.ip.windowSeconds,
    })

    if (keys.emailKey) {
      rules.push({
        name: 'email',
        key: keys.emailKey,
        max: RATE_LIMIT_CONFIG.resendConfirmation.email.max,
        windowSeconds: RATE_LIMIT_CONFIG.resendConfirmation.email.windowSeconds,
      })
    }

    rules.push({
      name: 'global_ip',
      key: keys.globalIpKey,
      max: RATE_LIMIT_CONFIG.resendConfirmation.globalIp.max,
      windowSeconds: RATE_LIMIT_CONFIG.resendConfirmation.globalIp.windowSeconds,
    })

    return rules
  }

  if (action === 'reset_password') {
    rules.push({
      name: 'ip',
      key: keys.ipKey,
      max: RATE_LIMIT_CONFIG.resetPassword.ip.max,
      windowSeconds: RATE_LIMIT_CONFIG.resetPassword.ip.windowSeconds,
    })

    if (keys.emailKey) {
      rules.push({
        name: 'email',
        key: keys.emailKey,
        max: RATE_LIMIT_CONFIG.resetPassword.email.max,
        windowSeconds: RATE_LIMIT_CONFIG.resetPassword.email.windowSeconds,
      })
    }

    return rules
  }

  rules.push({
    name: 'ip',
    key: keys.ipKey,
    max: RATE_LIMIT_CONFIG.loginAttempt.ip.max,
    windowSeconds: RATE_LIMIT_CONFIG.loginAttempt.ip.windowSeconds,
  })

  if (keys.emailKey) {
    rules.push({
      name: 'email',
      key: keys.emailKey,
      max: RATE_LIMIT_CONFIG.loginAttempt.email.max,
      windowSeconds: RATE_LIMIT_CONFIG.loginAttempt.email.windowSeconds,
    })
  }

  return rules
}

export async function logAuthSecurityEvent(args: {
  action: AuthRateLimitAction
  ip: string
  email?: string
  result: AuthSecurityEventResult
  userAgent?: string
  meta?: Record<string, unknown>
}) {
  const rawEmail = args.email?.trim() ?? ''
  const emailNorm = normalizeEmail(rawEmail)
  const ip = normalizeIp(args.ip)
  const keys = buildKeys(args.action, ip, emailNorm)

  await insertAuthSecurityEvents([
    {
      action: args.action,
      email: rawEmail || null,
      email_norm: emailNorm || null,
      ip,
      user_agent: normalizeUserAgent(args.userAgent),
      result: args.result,
      meta: {
        keys: keys.keys,
        ...args.meta,
      },
    },
  ])
}

export async function enforceAuthRateLimit({
  action,
  ip,
  email,
  userAgent,
}: EnforceAuthRateLimitArgs): Promise<AuthRateLimitResult> {
  const rawEmail = email?.trim() ?? ''
  const normalizedEmail = normalizeEmail(rawEmail)
  const normalizedIp = normalizeIp(ip)
  const keys = buildKeys(action, normalizedIp, normalizedEmail)
  const blockKeys = keys.keys.map((rawKey) => buildBlockKey(action, rawKey))
  const nowMs = Date.now()
  const nowIso = new Date(nowMs).toISOString()

  try {
    const { data: activeBlocks } = await supabaseAdmin
      .from('auth_security_blocks')
      .select('key, blocked_until')
      .eq('action', action)
      .in('key', blockKeys)
      .gt('blocked_until', nowIso)

    const blocks = (activeBlocks ?? []) as Array<{
      key: string
      blocked_until: string | null
    }>

    if (blocks.length > 0) {
      const retryAfter = blocks
        .map((block) =>
          block.blocked_until
            ? parseRetryAfterSeconds(block.blocked_until, nowMs)
            : null
        )
        .filter((value): value is number => typeof value === 'number')
        .reduce((max, value) => Math.max(max, value), 0)

      await insertAuthSecurityEvents([
        {
          action,
          email: rawEmail || null,
          email_norm: normalizedEmail || null,
          ip: normalizedIp,
          user_agent: normalizeUserAgent(userAgent),
          result: 'blocked',
          meta: {
            reason: 'active_block',
            keys: keys.keys,
          },
        },
      ])

      return {
        allowed: false,
        retryAfterSeconds: retryAfter || undefined,
      }
    }

    const rules = buildLimitRules(action, keys)

    const counts = await Promise.all(
      rules.map(async (rule) => ({
        rule,
        count: await countEventsForRule(
          action,
          rule,
          normalizedIp,
          normalizedEmail,
          rule.windowSeconds
        ),
      }))
    )

    const exceeded = counts.filter(({ rule, count }) => count >= rule.max)

    if (exceeded.length > 0) {
      const blocksToInsert = await Promise.all(
        exceeded.map(async ({ rule }) => {
          let blockSeconds = 0
          const blockKey = buildBlockKey(action, rule.key)

          if (action === 'login_attempt') {
            const priorBlocks = await countBlockedEventsForKey(
              action,
              blockKey
            )
            blockSeconds = resolveLoginBlockSeconds(priorBlocks)
          } else if (action === 'resend_confirmation') {
            blockSeconds = RATE_LIMIT_CONFIG.resendConfirmation.blockSeconds
          } else {
            blockSeconds = RATE_LIMIT_CONFIG.resetPassword.blockSeconds
          }

          return {
            action,
            key: blockKey,
            blocked_until: new Date(nowMs + blockSeconds * 1000).toISOString(),
            reason: 'limit_exceeded',
          }
        })
      )

      const retryAfterSeconds = blocksToInsert
        .map((block) => parseRetryAfterSeconds(block.blocked_until, nowMs) ?? 0)
        .reduce((max, value) => Math.max(max, value), 0)

      await supabaseAdmin
        .from('auth_security_blocks')
        .upsert(blocksToInsert, { onConflict: 'key' })

      const blockedEvents = exceeded.map(({ rule }) => ({
        action,
        email: rawEmail || null,
        email_norm: normalizedEmail || null,
        ip: normalizedIp,
        user_agent: normalizeUserAgent(userAgent),
        result: 'blocked' as const,
        meta: {
          reason: 'limit_exceeded',
          rule: rule.name,
          key: rule.key,
          block_key: buildBlockKey(action, rule.key),
        },
      }))

      await insertAuthSecurityEvents(blockedEvents)

      return {
        allowed: false,
        retryAfterSeconds: retryAfterSeconds || undefined,
      }
    }

    await insertAuthSecurityEvents([
      {
        action,
        email: rawEmail || null,
        email_norm: normalizedEmail || null,
        ip: normalizedIp,
        user_agent: normalizeUserAgent(userAgent),
        result: 'attempt',
        meta: {
          keys: keys.keys,
        },
      },
    ])

    return { allowed: true }
  } catch {
    await insertAuthSecurityEvents([
      {
        action,
        email: rawEmail || null,
        email_norm: normalizedEmail || null,
        ip: normalizedIp,
        user_agent: normalizeUserAgent(userAgent),
        result: 'attempt',
        meta: {
          keys: keys.keys,
          reason: 'rate_limit_failed',
        },
      },
    ])
    return { allowed: true }
  }
}

export function getRequestIp(request: Request) {
  const headerValue =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('true-client-ip')

  if (!headerValue) return 'unknown'
  const first = headerValue.split(',')[0]
  return first?.trim() || 'unknown'
}
