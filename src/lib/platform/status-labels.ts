export type TaskAssignmentStatus = 'draft' | 'published' | 'closed' | 'archived'

export type SubmissionStatus =
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'reviewed'

export function taskAssignmentStatusLabel(status: TaskAssignmentStatus): string {
  if (status === 'draft') return 'Borrador'
  if (status === 'published') return 'Publicada'
  if (status === 'closed') return 'Cerrada'
  return 'Archivada'
}

export function submissionStatusLabel(status: SubmissionStatus): string {
  if (status === 'submitted') return 'Entregada'
  if (status === 'changes_requested') return 'Cambios solicitados'
  if (status === 'approved') return 'Aprobada'
  if (status === 'rejected') return 'Rechazada'
  return 'Revisada'
}

export function taskAssignmentStatusBadgeClass(
  status: TaskAssignmentStatus
): string {
  if (status === 'published') {
    return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  }
  if (status === 'closed') {
    return 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
  }
  if (status === 'archived') {
    return 'border border-slate-700 bg-slate-800 text-slate-200'
  }
  return 'border border-slate-700 bg-slate-800 text-slate-100'
}

export function submissionStatusBadgeClass(status: SubmissionStatus): string {
  if (status === 'approved') {
    return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  }
  if (status === 'changes_requested') {
    return 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
  }
  if (status === 'rejected') {
    return 'border border-rose-500/30 bg-rose-500/10 text-rose-200'
  }
  if (status === 'reviewed') {
    return 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
  }
  return 'border border-slate-700 bg-slate-800 text-slate-100'
}

