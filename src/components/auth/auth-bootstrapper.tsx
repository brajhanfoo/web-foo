'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-stores'

export function AuthBootstrapper() {
  const hasBootstrappedReference = useRef(false)
  const refreshAuth = useAuthStore((state) => state.bootAuth)

  useEffect(() => {
    if (hasBootstrappedReference.current) return
    hasBootstrappedReference.current = true

    void refreshAuth()

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth()
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [refreshAuth])

  return null
}
