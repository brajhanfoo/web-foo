'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToastEnhanced } from '@/hooks/use-toast-enhanced'
import { useAuthStore } from '@/stores/auth-stores'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UsersTable, type UserRow, type AppRole } from './components/users-table'
import { UsersToolbar } from './components/users-toolbar'

const ROLE_OPTIONS: AppRole[] = ['talent', 'super_admin']

function safeText(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export default function AdminUsersPage() {
  const { showError, showSuccess } = useToastEnhanced()
  const currentUserId = useAuthStore((state) => state.userId)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all')
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({})
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null)

  const didLoadRef = useRef(false)

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true
    void loadUsers()
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    const roleParam = searchParams.get('role')
    const normalizedRole =
      roleParam === 'talent' || roleParam === 'super_admin' ? roleParam : 'all'

    setSearch((previous) => (previous === q ? previous : q))
    setRoleFilter((previous) =>
      previous === normalizedRole ? previous : normalizedRole
    )
  }, [searchParams])

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, first_name, last_name, email, role, is_active, profile_status, created_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      showError('No se pudieron cargar usuarios.', error.message)
      setRows([])
      setLoading(false)
      return
    }

    const cleaned = (data ?? []).map((row) => ({
      ...row,
      role: (row.role ?? 'talent') as AppRole,
      is_active: row.is_active ?? true,
    })) as UserRow[]
    setRows(cleaned)
    setLoading(false)
  }

  function setBusy(userId: string, value: boolean) {
    setBusyIds((previous) => ({ ...previous, [userId]: value }))
  }

  function updateQuery(nextSearch: string, nextRole: AppRole | 'all') {
    const params = new URLSearchParams(searchParams.toString())
    if (nextSearch.trim()) {
      params.set('q', nextSearch.trim())
    } else {
      params.delete('q')
    }

    if (nextRole !== 'all') {
      params.set('role', nextRole)
    } else {
      params.delete('role')
    }

    const query = params.toString()
    const url = query ? `${pathname}?${query}` : pathname
    router.replace(url, { scroll: false })
  }

  async function handleRoleChange(user: UserRow, nextRole: AppRole) {
    if (user.role === nextRole) return

    setBusy(user.id, true)
    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', user.id)

    setBusy(user.id, false)

    if (error) {
      showError('No se pudo actualizar el rol.', error.message)
      return
    }

    setRows((previous) =>
      previous.map((row) =>
        row.id === user.id ? { ...row, role: nextRole } : row
      )
    )
    showSuccess('Rol actualizado.')
  }

  async function handleToggleActive(user: UserRow) {
    const nextValue = !user.is_active
    setBusy(user.id, true)
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: nextValue })
      .eq('id', user.id)

    setBusy(user.id, false)

    if (error) {
      showError('No se pudo actualizar el estado.', error.message)
      return
    }

    setRows((previous) =>
      previous.map((row) =>
        row.id === user.id ? { ...row, is_active: nextValue } : row
      )
    )
    showSuccess(nextValue ? 'Usuario activado.' : 'Usuario desactivado.')
  }

  function requestToggleActive(user: UserRow) {
    if (!user.is_active) {
      void handleToggleActive(user)
      return
    }

    setConfirmUser(user)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const hasFilter = roleFilter !== 'all'
    return rows.filter((row) => {
      if (hasFilter && row.role !== roleFilter) return false
      if (!q) return true
      const hay = `${safeText(row.first_name)} ${safeText(row.last_name)} ${safeText(row.email)}`.toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search, roleFilter])

  function handleSearchChange(value: string) {
    setSearch(value)
    updateQuery(value, roleFilter)
  }

  function handleRoleFilterChange(value: AppRole | 'all') {
    setRoleFilter(value)
    updateQuery(search, value)
  }

  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-[#0F1117] text-white">
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Gestioná roles y estado de acceso del equipo.
          </CardDescription>
        </CardHeader>
      </Card>

      <UsersToolbar
        search={search}
        onSearchChange={handleSearchChange}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        totalCount={rows.length}
        filteredCount={filtered.length}
      />

      <UsersTable
        rows={filtered}
        loading={loading}
        busyIds={busyIds}
        currentUserId={currentUserId}
        roleOptions={ROLE_OPTIONS}
        onRoleChange={handleRoleChange}
        onToggleActive={requestToggleActive}
      />

      <ConfirmDialog
        open={Boolean(confirmUser)}
        onOpenChange={(open) => {
          if (!open) setConfirmUser(null)
        }}
        title="¿Desactivar usuario?"
        description="No podrá acceder a la plataforma hasta que lo actives nuevamente."
        confirmLabel="Desactivar"
        confirmVariant="destructive"
        onConfirm={() => {
          if (!confirmUser) return
          void handleToggleActive(confirmUser)
          setConfirmUser(null)
        }}
      />
    </div>
  )
}
