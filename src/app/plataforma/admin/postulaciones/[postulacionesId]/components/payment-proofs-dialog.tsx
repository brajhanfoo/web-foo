'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export type ProofInfo = {
  object_path: string
  mime_type: string
  original_filename: string | null
  notes: string | null
  size_bytes: number
  created_at: string
  signed_url: string
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB'] as const
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function isPdf(mime: string): boolean {
  return mime === 'application/pdf'
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/')
}

type GetSignedUrlResponse =
  | { ok: true; proof: ProofInfo | null }
  | { ok: false; message: string }

type SimpleOkResponse = { ok: true } | { ok: false; message: string }

export function PaymentProofDialog({
  applicationId,
  triggerLabel,
  showSuccess,
  showError,
  disabled,
  onProofPresenceChange,
}: {
  applicationId: string | null
  triggerLabel: string
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  disabled?: boolean
  onProofPresenceChange?: (hasProof: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [proof, setProof] = useState<ProofInfo | null>(null)
  const [notes, setNotes] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const canWork = Boolean(applicationId)

  const title = useMemo(() => {
    return proof ? 'Comprobante de pago' : 'Subir comprobante de pago'
  }, [proof])

  useEffect(() => {
    if (!open) return
    if (!applicationId) return

    let cancelled = false

    async function run() {
      setIsLoading(true)
      try {
        const res = await fetch(
          '/api/plataforma/payment-proofs/get-signed-url',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ application_id: applicationId }),
          }
        )

        const json = (await res.json()) as GetSignedUrlResponse

        if (cancelled) return

        if (!json.ok) {
          setProof(null)
          setNotes('')
          onProofPresenceChange?.(false)
          showError('No se pudo cargar comprobante', json.message)
          setIsLoading(false)
          return
        }

        setProof(json.proof)
        setNotes(json.proof?.notes ?? '')
        onProofPresenceChange?.(Boolean(json.proof))
        setIsLoading(false)
      } catch {
        if (cancelled) return
        setIsLoading(false)
        showError('Error', 'No se pudo cargar el comprobante.')
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [open, applicationId, showError, onProofPresenceChange])

  async function reloadProof() {
    if (!applicationId) return

    const res = await fetch('/api/plataforma/payment-proofs/get-signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId }),
    })
    const json = (await res.json()) as GetSignedUrlResponse

    if (json.ok) {
      setProof(json.proof)
      setNotes(json.proof?.notes ?? '')
      onProofPresenceChange?.(Boolean(json.proof))
    }
  }

  async function handleUpload() {
    if (!applicationId) return

    const input = fileInputRef.current
    const file = input?.files?.[0] ?? null

    if (!file) {
      showError('Falta archivo', 'Seleccioná un PDF o una imagen.')
      return
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size <= 0 || file.size > maxBytes) {
      showError('Archivo inválido', 'Máximo 5 MB.')
      return
    }

    const allowed = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ])
    if (!allowed.has(file.type)) {
      showError('Tipo no permitido', 'Usá PDF o imagen (JPG/PNG/WEBP).')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.set('application_id', applicationId)
      formData.set('notes', notes.trim())
      formData.set('file', file)

      const res = await fetch('/api/plataforma/payment-proofs/upload', {
        method: 'POST',
        body: formData,
      })

      const json = (await res.json()) as SimpleOkResponse

      if (!json.ok) {
        showError('No se pudo subir', json.message)
        setIsUploading(false)
        return
      }

      showSuccess('Subido', 'Comprobante actualizado correctamente.')
      await reloadProof()

      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsUploading(false)
    } catch {
      setIsUploading(false)
      showError('Error', 'No se pudo subir el comprobante.')
    }
  }

  async function handleDelete() {
    if (!applicationId) return
    if (!proof) return

    setIsDeleting(true)
    try {
      const res = await fetch('/api/plataforma/payment-proofs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      })
      const json = (await res.json()) as SimpleOkResponse

      if (!json.ok) {
        showError('No se pudo eliminar', json.message)
        setIsDeleting(false)
        return
      }

      showSuccess('Eliminado', 'Comprobante eliminado.')
      setProof(null)
      setNotes('')
      onProofPresenceChange?.(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsDeleting(false)
    } catch {
      setIsDeleting(false)
      showError('Error', 'No se pudo eliminar el comprobante.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="w-full bg-[#00CCA4] text-black hover:bg-[#00e6b3] focus:ring-[#00e6b3]/50 cursor-pointer"
          disabled={!canWork || Boolean(disabled)}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto bg-slate-900 text-slate-100 sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-sm text-slate-400 bg-slate-900">Cargando…</div>
        ) : (
          <div className="space-y-4 bg-slate-900">
            {proof ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {proof.original_filename ?? 'Comprobante'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatBytes(proof.size_bytes)} · {proof.mime_type}
                    </div>
                  </div>
                  <Badge variant="secondary">Cargado</Badge>
                </div>

                <div className="rounded-lg border p-3 bg-slate-900">
                  {isImage(proof.mime_type) ? (
                    <div className="relative h-[260px] w-full overflow-hidden rounded-md sm:h-[360px]">
                      <Image
                        src={proof.signed_url}
                        alt="Comprobante"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : isPdf(proof.mime_type) ? (
                    <iframe
                      title="Comprobante PDF"
                      src={proof.signed_url}
                      className="h-[260px] w-full rounded-md border sm:h-[360px]"
                    />
                  ) : (
                    <a
                      href={proof.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline"
                    >
                      Abrir comprobante
                    </a>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Observaciones</div>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Opcional…"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUpload}
                    disabled={isUploading || !canWork}
                  >
                    {isUploading ? 'Actualizando…' : 'Reemplazar archivo'}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || !canWork}
                  >
                    {isDeleting ? 'Eliminando…' : 'Eliminar'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cerrar
                  </Button>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-slate-400 mb-2">
                    Elegí un PDF o imagen (JPG/PNG/WEBP). Máximo 5 MB.
                  </div>
                  <Input ref={fileInputRef} type="file" accept=".pdf,image/*" />
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-slate-400">
                  Todavía no hay comprobante cargado.
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Observaciones</div>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Opcional…"
                  />
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-slate-400 mb-2">
                    Elegí un PDF o imagen (JPG/PNG/WEBP). Máximo 5 MB.
                  </div>
                  <Input ref={fileInputRef} type="file" accept=".pdf,image/*" />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUpload}
                    disabled={isUploading || !canWork}
                  >
                    {isUploading ? 'Subiendo…' : 'Subir comprobante'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
