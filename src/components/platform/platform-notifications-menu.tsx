'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase/client'

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string
  read_at: string | null
  created_at: string
}

type NotificationsPayload =
  | {
      ok: true
      viewer_user_id?: string | null
      notifications?: NotificationRow[]
    }
  | { ok: false; message?: string }
  | null

function formatRelativeDate(dateIso: string): string {
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return 'ahora'
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

export function PlatformNotificationsMenu({
  className,
}: {
  className?: string
}) {
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const unreadCount = useMemo(
    () => rows.reduce((acc, row) => (row.read_at ? acc : acc + 1), 0),
    [rows]
  )

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/plataforma/notifications?limit=20', {
      cache: 'no-store',
    })
    const payload = (await response.json().catch(() => null)) as NotificationsPayload

    if (response.ok && payload?.ok) {
      if (payload.viewer_user_id) {
        setUserId(payload.viewer_user_id)
      }
      setRows(payload.notifications ?? [])
    }
    setLoading(false)
  }, [])

  async function markRead(ids: string[] | 'all') {
    setBusy(true)
    await fetch('/api/plataforma/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        ids === 'all'
          ? { mark_all: true }
          : {
              ids,
            }
      ),
    }).catch(() => null)
    await loadNotifications()
    setBusy(false)
  }

  useEffect(() => {
    void loadNotifications()
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
      void loadNotifications()
    })

    supabase.auth.getUser().then(({ data: userData }) => {
      if (userData.user?.id) {
        setUserId(userData.user.id)
      }
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [loadNotifications])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadNotifications()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, loadNotifications])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className={[
            'relative border border-white/10 bg-white/10 text-white hover:bg-white/15',
            className ?? '',
          ].join(' ')}
          aria-label="Ver notificaciones"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1">
              <Badge className="h-5 min-w-5 border border-emerald-400/50 bg-emerald-500/20 px-1 text-[10px] text-emerald-100">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(90vw,380px)] border-slate-800 bg-slate-900 p-0 text-slate-100"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-slate-100">
            Notificaciones
          </DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            disabled={busy || unreadCount === 0}
            onClick={() => void markRead('all')}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas
          </Button>
        </div>
        <DropdownMenuSeparator className="bg-slate-800" />
        <div className="max-h-[420px] overflow-y-auto p-1">
          {loading ? (
            <div className="px-3 py-4 text-sm text-slate-300">Cargando...</div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-400">
              No tienes notificaciones.
            </div>
          ) : (
            rows.map((row) => (
              <DropdownMenuItem
                key={row.id}
                className={[
                  'group flex cursor-pointer flex-col items-start gap-1 rounded-md px-3 py-2 text-left',
                  row.read_at ? 'opacity-70' : 'bg-emerald-500/5',
                ].join(' ')}
                onClick={() => {
                  if (row.read_at) return
                  void markRead([row.id])
                }}
              >
                <div className="w-full min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-100">
                    {row.title}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-slate-300">
                    {row.body}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {formatRelativeDate(row.created_at)}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
