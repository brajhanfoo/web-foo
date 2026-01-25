'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export type ProfileRole = 'talent' | 'super_admin' | 'admin' | 'staff'

export type ProfileRow = {
  id: string
  role: ProfileRole
  first_name: string | null
  last_name: string | null
  country_residence: string | null
  whatsapp_e164: string | null
  linkedin_url: string | null
  profile_status: string | null
  document_number: string | null
  terms_version: string | null
  portfolio_url: string | null
  english_level: string | null
  terms_accepted_at: string | null
  marketing_opt_in: boolean
  created_at: string
  updated_at: string
}

type AuthStoreState = {
  isBooting: boolean
  userId: string | null
  email: string | null
  profile: ProfileRow | null

  bootAuth: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  isBooting: true,
  userId: null,
  email: null,
  profile: null,

  bootAuth: async () => {
    set({ isBooting: true })

    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      set({ isBooting: false, userId: null, email: null, profile: null })
      return
    }

    const userId = data.user.id
    const email = data.user.email ?? null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, role, first_name, last_name, country_residence, whatsapp_e164, linkedin_url, profile_status, document_number, terms_version, portfolio_url, english_level, terms_accepted_at, marketing_opt_in, created_at, updated_at'
      )
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      set({ isBooting: false, userId, email, profile: null })
      return
    }

    set({ isBooting: false, userId, email, profile })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ userId: null, email: null, profile: null })
  },
}))
