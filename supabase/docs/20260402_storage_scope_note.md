# Nota tecnica: Storage en migration `20260402_docentes_tasks_notifications_activity.sql`

## Cambios aplicados

Se retiraron de la migration las sentencias no soportadas sobre `storage.objects`:

- `alter table storage.objects enable row level security`
- `create trigger ... on storage.objects`
- `drop trigger ... on storage.objects`
- funcion trigger `public.enforce_task_submissions_storage_guard()` (ya no se crea)

Motivo: en Supabase administrado esas operaciones pueden fallar con `must be owner of table objects`.

## Que si queda en SQL

- Creacion/actualizacion idempotente del bucket privado `task-submissions`.
- Policies sobre `storage.objects` para `authenticated`:
  - `task_submissions_no_select`
  - `task_submissions_no_insert`
  - `task_submissions_no_update`
  - `task_submissions_no_delete`

## Que pasa a backend (fuera de SQL)

- Uploads al bucket solo via backend usando `service_role`.
- Validacion de autorizacion y reglas de negocio en API routes / server actions.
- Entrega de archivos unicamente por signed URLs generadas server-side.

## Checklist post-push

1. Confirmar bucket `task-submissions` creado y `public = false`.
2. Verificar que clientes `authenticated` no puedan leer/escribir directo en `storage.objects` para ese bucket.
3. Validar flujo backend:
   - upload server-side con `service_role`
   - generacion de signed URL server-side
   - autorizacion previa por usuario/tarea/equipo
