'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

type ActivityTrackerProps = {
  intervalMs?: number
}

export function ActivityTracker({ intervalMs = 120000 }: ActivityTrackerProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname.startsWith('/plataforma')) return

    let cancelled = false

    const sendPing = async () => {
      if (cancelled) return
      await fetch('/api/plataforma/activity/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'navigation',
          route: pathname,
        }),
      }).catch(() => null)
    }

    void sendPing()

    const interval = window.setInterval(() => {
      void sendPing()
    }, intervalMs)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [intervalMs, pathname])

  return null
}
