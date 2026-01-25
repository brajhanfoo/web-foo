'use client'

import { toast } from 'sonner'

export function useToastEnhanced() {
  const showSuccess = (title: string, description?: string) => {
    toast.success(title, {
      description,
      duration: 4000,
    })
  }

  const showError = (title: string, description?: string) => {
    toast.error(title, {
      description,
      duration: 6000,
    })
  }

  const showWarning = (title: string, description?: string) => {
    toast.warning(title, {
      description,
      duration: 5000,
    })
  }

  const showInfo = (title: string, description?: string) => {
    toast.info(title, {
      description,
      duration: 4000,
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
