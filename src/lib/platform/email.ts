type SendEmailInput = {
  to: string[]
  subject: string
  text: string
  html?: string
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.includes('@'))
    )
  )
}

export async function sendTransactionalEmail(
  input: SendEmailInput
): Promise<void> {
  const recipients = uniqueNonEmpty(input.to)
  if (!recipients.length) return

  const apiKey =
    process.env.RESEND_API_KEY ?? process.env.SUPABASE_SMTP_RESEND_API_KEY ?? ''

  if (!apiKey) return

  const fromAddress =
    process.env.NOTIFICATIONS_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    'Foo Talent Group <no-reply@footalentgroup.com>'

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: recipients,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${input.text}</p>`,
    }),
    cache: 'no-store',
  }).catch(() => null)
}

