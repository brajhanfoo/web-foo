'use client'

import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

export function useToastEnhanced() {
  const showSuccess = useCallback((title: string, description?: string) => {
    toast.success(title, {
      description,
      duration: 4000,
    })
  }, [])

  const showError = useCallback((title: string, description?: string) => {
    toast.error(title, {
      description,
      duration: 6000,
    })
  }, [])

  const showWarning = useCallback((title: string, description?: string) => {
    toast.warning(title, {
      description,
      duration: 5000,
    })
  }, [])

  const showInfo = useCallback((title: string, description?: string) => {
    toast.info(title, {
      description,
      duration: 4000,
    })
  }, [])

  return useMemo(
    () => ({
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [showSuccess, showError, showWarning, showInfo]
  )
}
