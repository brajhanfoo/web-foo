-- 20260402_docentes_tasks_notifications_activity.sql
-- Modulo completo: docentes + entregables + feedback + notificaciones + actividad
-- Reglas clave:
-- - submission_scope obligatorio y validado contra task_assignments.submission_mode
-- - uploads al bucket task-submissions solo por service role (backend)
-- - notificaciones materializadas por usuario (fan-out)
-- - feedback con historial completo

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- Roles y enums
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_type where typname = 'app_role') then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'app_role'
        and e.enumlabel = 'docente'
    ) then
      alter type public.app_role add value 'docente';
    end if;
  else
    create type public.app_role as enum (
      'talent',
      'staff',
      'admin',
      'super_admin',
      'docente'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_submission_mode') then
    create type public.task_submission_mode as enum ('team', 'individual');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_assignment_status') then
    create type public.task_assignment_status as enum (
      'draft',
      'published',
      'closed',
      'archived'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_grading_mode') then
    create type public.task_grading_mode as enum ('score_100', 'pass_fail', 'none');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'submission_scope') then
    create type public.submission_scope as enum ('team', 'individual');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'submission_type') then
    create type public.submission_type as enum ('link', 'file', 'both');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum (
      'submitted',
      'changes_requested',
      'approved',
      'rejected',
      'reviewed'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'submission_event_type') then
    create type public.submission_event_type as enum (
      'created',
      'resubmitted',
      'reviewed',
      'reopened',
      'graded',
      'changes_requested',
      'approved',
      'rejected',
      'feedback_added'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_target_type') then
    create type public.notification_target_type as enum ('user', 'team');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Campos nuevos en profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists professional_area_id uuid null,
  add column if not exists password_reset_required boolean not null default false,
  add column if not exists last_login_at timestamptz null,
  add column if not exists last_relevant_activity_at timestamptz null;

-- ---------------------------------------------------------------------------
-- Helpers base
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.app_current_role(p_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role::text
  from public.profiles p
  where p.id = p_user_id
  limit 1;
$$;

create or replace function public.app_is_admin_level(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.role in ('super_admin', 'admin')
      and coalesce(p.is_active, true) = true
  );
$$;

create or replace function public.app_is_super_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.role = 'super_admin'
      and coalesce(p.is_active, true) = true
  );
$$;

create or replace function public.app_is_docente(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.role = 'docente'
      and coalesce(p.is_active, true) = true
  );
$$;

create or replace function public.app_is_team_member(p_user_id uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a.applicant_profile_id = p_user_id
      and a.team_id = p_team_id
      and a.status = 'enrolled'
  );
$$;

-- ---------------------------------------------------------------------------
-- Catalogo de areas profesionales
-- ---------------------------------------------------------------------------

create table if not exists public.professional_areas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_professional_areas_updated_at on public.professional_areas;
create trigger trg_professional_areas_updated_at
before update on public.professional_areas
for each row
execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_professional_area_fk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_professional_area_fk
      foreign key (professional_area_id)
      references public.professional_areas (id)
      on update cascade
      on delete set null;
  end if;
end $$;

insert into public.professional_areas (code, name)
values
  ('product_manager', 'Product Manager'),
  ('product_designer', 'Product Designer'),
  ('qa_engineer', 'QA Engineer'),
  ('software_engineer', 'Software Engineer')
on conflict (code) do update
set
  name = excluded.name,
  is_active = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Horarios de equipos (para detectar conflictos de asignacion docente)
-- ---------------------------------------------------------------------------

create table if not exists public.team_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.program_edition_teams(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'America/Guayaquil',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

create unique index if not exists ux_team_schedule_slots_unique_window
  on public.team_schedule_slots (team_id, day_of_week, start_time, end_time);

create index if not exists idx_team_schedule_slots_team_day_time
  on public.team_schedule_slots (team_id, day_of_week, start_time, end_time);

drop trigger if exists trg_team_schedule_slots_updated_at on public.team_schedule_slots;
create trigger trg_team_schedule_slots_updated_at
before update on public.team_schedule_slots
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Asignaciones docente-equipo (N:N)
-- ---------------------------------------------------------------------------

create table if not exists public.docente_team_assignments (
  id uuid primary key default gen_random_uuid(),
  docente_profile_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  edition_id uuid not null references public.program_editions(id) on delete cascade,
  team_id uuid not null references public.program_edition_teams(id) on delete cascade,
  staff_role text null,
  is_active boolean not null default true,
  assigned_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_docente_team_assignments_unique_pair
  on public.docente_team_assignments (docente_profile_id, team_id);

create index if not exists idx_docente_team_assignments_docente_team
  on public.docente_team_assignments (docente_profile_id, team_id);

create index if not exists idx_docente_team_assignments_team
  on public.docente_team_assignments (team_id);

drop trigger if exists trg_docente_team_assignments_updated_at on public.docente_team_assignments;
create trigger trg_docente_team_assignments_updated_at
before update on public.docente_team_assignments
for each row
execute function public.set_updated_at();

create or replace function public.validate_docente_team_assignment_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_team_edition_id uuid;
  v_edition_program_id uuid;
  v_docente_role text;
begin
  select t.edition_id
  into v_team_edition_id
  from public.program_edition_teams t
  where t.id = new.team_id;

  if v_team_edition_id is null then
    raise exception 'team_id % no existe', new.team_id;
  end if;

  select e.program_id
  into v_edition_program_id
  from public.program_editions e
  where e.id = v_team_edition_id;

  if v_edition_program_id is null then
    raise exception 'edition % no existe para el equipo %', v_team_edition_id, new.team_id;
  end if;

  if new.edition_id is distinct from v_team_edition_id then
    raise exception 'edition_id (%) no coincide con la edition del team (%)', new.edition_id, v_team_edition_id;
  end if;

  if new.program_id is distinct from v_edition_program_id then
    raise exception 'program_id (%) no coincide con el program de la edition (%)', new.program_id, v_edition_program_id;
  end if;

  select p.role::text
  into v_docente_role
  from public.profiles p
  where p.id = new.docente_profile_id;

  if v_docente_role is distinct from 'docente' then
    raise exception 'El perfil % debe tener rol docente', new.docente_profile_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_docente_team_assignment_consistency on public.docente_team_assignments;
create trigger trg_docente_team_assignment_consistency
before insert or update on public.docente_team_assignments
for each row
execute function public.validate_docente_team_assignment_consistency();

create or replace function public.get_docente_assignment_conflicts(
  p_docente_profile_id uuid,
  p_team_id uuid,
  p_exclude_assignment_id uuid default null
)
returns table (
  conflict_assignment_id uuid,
  conflict_team_id uuid,
  conflict_team_name text,
  day_of_week smallint,
  start_time time,
  end_time time
)
language sql
stable
security definer
set search_path = public
as $$
  with target_slots as (
    select ts.day_of_week, ts.start_time, ts.end_time
    from public.team_schedule_slots ts
    where ts.team_id = p_team_id
      and ts.is_active = true
  ),
  docente_assignments as (
    select dta.id, dta.team_id
    from public.docente_team_assignments dta
    where dta.docente_profile_id = p_docente_profile_id
      and dta.is_active = true
      and (p_exclude_assignment_id is null or dta.id <> p_exclude_assignment_id)
  )
  select
    da.id as conflict_assignment_id,
    da.team_id as conflict_team_id,
    t.name as conflict_team_name,
    ts.day_of_week,
    ts.start_time,
    ts.end_time
  from docente_assignments da
  join public.program_edition_teams t on t.id = da.team_id
  join public.team_schedule_slots ts on ts.team_id = da.team_id and ts.is_active = true
  join target_slots trg
    on trg.day_of_week = ts.day_of_week
   and ts.start_time < trg.end_time
   and trg.start_time < ts.end_time;
$$;

create or replace function public.app_is_docente_assigned(p_user_id uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.docente_team_assignments dta
    where dta.docente_profile_id = p_user_id
      and dta.team_id = p_team_id
      and dta.is_active = true
  );
$$;

create or replace function public.app_can_manage_team(p_user_id uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_is_admin_level(p_user_id)
    or public.app_is_docente_assigned(p_user_id, p_team_id);
$$;

create or replace function public.app_can_view_team(p_user_id uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_can_manage_team(p_user_id, p_team_id)
    or public.app_is_team_member(p_user_id, p_team_id);
$$;

-- ---------------------------------------------------------------------------
-- Tareas: templates + assignments
-- ---------------------------------------------------------------------------

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  instructions text null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_task_templates_updated_at on public.task_templates;
create trigger trg_task_templates_updated_at
before update on public.task_templates
for each row
execute function public.set_updated_at();

create table if not exists public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_template_id uuid not null references public.task_templates(id) on delete restrict,
  milestone_id uuid not null references public.program_edition_milestones(id) on delete cascade,
  team_id uuid not null references public.program_edition_teams(id) on delete cascade,
  edition_id uuid not null references public.program_editions(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  deadline_at timestamptz null,
  allow_resubmission boolean not null default false,
  resubmission_deadline_at timestamptz null,
  max_attempts int not null default 1 check (max_attempts >= 1),
  submission_mode public.task_submission_mode not null,
  grading_mode public.task_grading_mode not null default 'score_100',
  status public.task_assignment_status not null default 'draft',
  is_published boolean not null default false,
  published_at timestamptz null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    resubmission_deadline_at is null
    or deadline_at is null
    or resubmission_deadline_at >= deadline_at
  )
);

create index if not exists idx_task_assignments_team_milestone_status_deadline
  on public.task_assignments (team_id, milestone_id, status, deadline_at);

create index if not exists idx_task_assignments_milestone
  on public.task_assignments (milestone_id);

drop trigger if exists trg_task_assignments_updated_at on public.task_assignments;
create trigger trg_task_assignments_updated_at
before update on public.task_assignments
for each row
execute function public.set_updated_at();

create or replace function public.validate_task_assignment_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_milestone_team_id uuid;
  v_milestone_edition_id uuid;
  v_program_id uuid;
begin
  select m.team_id, m.edition_id
  into v_milestone_team_id, v_milestone_edition_id
  from public.program_edition_milestones m
  where m.id = new.milestone_id;

  if v_milestone_team_id is null then
    raise exception 'milestone_id % no existe', new.milestone_id;
  end if;

  if new.team_id is distinct from v_milestone_team_id then
    raise exception 'team_id (%) no coincide con el team del milestone (%)',
      new.team_id, v_milestone_team_id;
  end if;

  if new.edition_id is distinct from v_milestone_edition_id then
    raise exception 'edition_id (%) no coincide con la edition del milestone (%)',
      new.edition_id, v_milestone_edition_id;
  end if;

  select e.program_id
  into v_program_id
  from public.program_editions e
  where e.id = new.edition_id;

  if v_program_id is null then
    raise exception 'edition_id % no existe', new.edition_id;
  end if;

  if new.program_id is distinct from v_program_id then
    raise exception 'program_id (%) no coincide con el program de la edition (%)',
      new.program_id, v_program_id;
  end if;

  if new.status = 'published' then
    new.is_published := true;
    if new.published_at is null then
      new.published_at := now();
    end if;
  end if;

  if new.status = 'closed' and new.closed_at is null then
    new.closed_at := now();
  end if;

  if new.is_published = true and new.status = 'draft' then
    new.status := 'published';
    if new.published_at is null then
      new.published_at := now();
    end if;
  end if;

  if new.allow_resubmission = false then
    new.resubmission_deadline_at := null;
    if new.max_attempts < 1 then
      new.max_attempts := 1;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_task_assignment_consistency on public.task_assignments;
create trigger trg_task_assignment_consistency
before insert or update on public.task_assignments
for each row
execute function public.validate_task_assignment_consistency();

-- ---------------------------------------------------------------------------
-- Submissions + feedback + auditoria
-- ---------------------------------------------------------------------------

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_assignment_id uuid not null references public.task_assignments(id) on delete cascade,
  team_id uuid not null references public.program_edition_teams(id) on delete cascade,
  submission_scope public.submission_scope not null,
  owner_profile_id uuid null references public.profiles(id) on delete cascade,
  submission_type public.submission_type not null,
  link_url text null,
  file_bucket_id text null default 'task-submissions',
  file_path text null,
  file_name text null,
  file_mime text null,
  file_size_bytes bigint null check (file_size_bytes is null or file_size_bytes > 0),
  comment text null,
  attempt_number int not null check (attempt_number >= 1),
  is_current_attempt boolean not null default true,
  is_resubmission boolean not null default false,
  submitted_at timestamptz not null default now(),
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  status public.submission_status not null default 'submitted',
  reviewed_at timestamptz null,
  reviewed_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (submission_scope = 'team' and owner_profile_id is null)
    or (submission_scope = 'individual' and owner_profile_id is not null)
  ),
  check (
    (attempt_number = 1 and is_resubmission = false)
    or (attempt_number > 1 and is_resubmission = true)
  ),
  check (
    (submission_type = 'link' and link_url is not null and file_path is null)
    or (submission_type = 'file' and file_path is not null and link_url is null)
    or (submission_type = 'both' and file_path is not null and link_url is not null)
  )
);

create index if not exists idx_submissions_task_assignment_id
  on public.submissions (task_assignment_id);

create index if not exists idx_submissions_team_id
  on public.submissions (team_id);

create index if not exists idx_submissions_submitted_by
  on public.submissions (submitted_by);

create index if not exists idx_submissions_owner_profile_id
  on public.submissions (owner_profile_id);

create unique index if not exists ux_submissions_current_team_attempt
  on public.submissions (task_assignment_id)
  where submission_scope = 'team' and is_current_attempt = true;

create unique index if not exists ux_submissions_current_individual_attempt
  on public.submissions (task_assignment_id, owner_profile_id)
  where submission_scope = 'individual' and is_current_attempt = true;

drop trigger if exists trg_submissions_updated_at on public.submissions;
create trigger trg_submissions_updated_at
before update on public.submissions
for each row
execute function public.set_updated_at();

create or replace function public.validate_and_prepare_submission()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_assignment record;
  v_previous_attempt int;
begin
  select
    ta.id,
    ta.team_id,
    ta.submission_mode,
    ta.status,
    ta.deadline_at,
    ta.allow_resubmission,
    ta.resubmission_deadline_at,
    ta.max_attempts
  into v_assignment
  from public.task_assignments ta
  where ta.id = new.task_assignment_id
  for update;

  if v_assignment.id is null then
    raise exception 'task_assignment_id % no existe', new.task_assignment_id;
  end if;

  if new.team_id is distinct from v_assignment.team_id then
    raise exception 'team_id (%) no coincide con el team del task_assignment (%)',
      new.team_id, v_assignment.team_id;
  end if;

  -- Validacion obligatoria submission_scope vs submission_mode
  if v_assignment.submission_mode = 'team' and new.submission_scope <> 'team' then
    raise exception 'submission_scope debe ser team cuando submission_mode=team';
  end if;

  if v_assignment.submission_mode = 'individual' and new.submission_scope <> 'individual' then
    raise exception 'submission_scope debe ser individual cuando submission_mode=individual';
  end if;

  if new.submission_scope = 'individual' and new.owner_profile_id is null then
    raise exception 'owner_profile_id es obligatorio para submission_scope=individual';
  end if;

  if new.submission_scope = 'team' and new.owner_profile_id is not null then
    raise exception 'owner_profile_id debe ser NULL para submission_scope=team';
  end if;

  if v_assignment.status in ('closed', 'archived', 'draft') then
    raise exception 'La tarea no acepta entregas en estado %', v_assignment.status;
  end if;

  if v_assignment.deadline_at is not null and now() > v_assignment.deadline_at then
    raise exception 'deadline expirado para esta tarea';
  end if;

  if tg_op = 'UPDATE' then
    if old.task_assignment_id is distinct from new.task_assignment_id
      or old.team_id is distinct from new.team_id
      or old.submission_scope is distinct from new.submission_scope
      or old.owner_profile_id is distinct from new.owner_profile_id
      or old.attempt_number is distinct from new.attempt_number
      or old.submitted_by is distinct from new.submitted_by
    then
      raise exception 'No se permite mutar claves estructurales de submission';
    end if;
    return new;
  end if;

  if new.submission_scope = 'team' then
    select coalesce(max(s.attempt_number), 0)
    into v_previous_attempt
    from public.submissions s
    where s.task_assignment_id = new.task_assignment_id
      and s.submission_scope = 'team';

    update public.submissions s
    set is_current_attempt = false
    where s.task_assignment_id = new.task_assignment_id
      and s.submission_scope = 'team'
      and s.is_current_attempt = true;
  else
    if not exists (
      select 1
      from public.applications a
      where a.applicant_profile_id = new.owner_profile_id
        and a.team_id = new.team_id
        and a.status = 'enrolled'
    ) then
      raise exception 'owner_profile_id no pertenece al team';
    end if;

    select coalesce(max(s.attempt_number), 0)
    into v_previous_attempt
    from public.submissions s
    where s.task_assignment_id = new.task_assignment_id
      and s.submission_scope = 'individual'
      and s.owner_profile_id = new.owner_profile_id;

    update public.submissions s
    set is_current_attempt = false
    where s.task_assignment_id = new.task_assignment_id
      and s.submission_scope = 'individual'
      and s.owner_profile_id = new.owner_profile_id
      and s.is_current_attempt = true;
  end if;

  new.attempt_number := v_previous_attempt + 1;
  new.is_current_attempt := true;
  new.is_resubmission := new.attempt_number > 1;

  if new.attempt_number > v_assignment.max_attempts then
    raise exception 'Se alcanzó max_attempts (%).', v_assignment.max_attempts;
  end if;

  if new.attempt_number > 1 then
    if v_assignment.allow_resubmission = false then
      raise exception 'Reentrega no permitida para esta tarea';
    end if;

    if v_assignment.resubmission_deadline_at is not null
      and now() > v_assignment.resubmission_deadline_at
    then
      raise exception 'resubmission_deadline expirado';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_submissions_validate_and_prepare on public.submissions;
create trigger trg_submissions_validate_and_prepare
before insert or update on public.submissions
for each row
execute function public.validate_and_prepare_submission();

create table if not exists public.submission_feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  comment text not null,
  score numeric(5,2) null,
  score_max int not null default 100 check (score_max > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (score is null or score >= 0)
);

create index if not exists idx_submission_feedback_submission_created_actor
  on public.submission_feedback (submission_id, created_at desc, actor_id);

drop trigger if exists trg_submission_feedback_updated_at on public.submission_feedback;
create trigger trg_submission_feedback_updated_at
before update on public.submission_feedback
for each row
execute function public.set_updated_at();

create or replace function public.validate_submission_feedback()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_grading_mode public.task_grading_mode;
begin
  if length(new.comment) > 5000 then
    raise exception 'comment excede 5000 caracteres';
  end if;

  select ta.grading_mode
  into v_grading_mode
  from public.submissions s
  join public.task_assignments ta on ta.id = s.task_assignment_id
  where s.id = new.submission_id;

  if v_grading_mode is null then
    raise exception 'submission_id % no existe', new.submission_id;
  end if;

  if v_grading_mode = 'score_100' then
    if new.score is null then
      raise exception 'score es obligatorio en grading_mode=score_100';
    end if;

    if new.score < 0 or new.score > 100 then
      raise exception 'score debe estar entre 0 y 100';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_submission_feedback_validate on public.submission_feedback;
create trigger trg_submission_feedback_validate
before insert or update on public.submission_feedback
for each row
execute function public.validate_submission_feedback();

create table if not exists public.submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  event_type public.submission_event_type not null,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_submission_events_submission_created_desc
  on public.submission_events (submission_id, created_at desc);

create or replace function public.submission_events_on_submission_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.submission_events (submission_id, event_type, actor_id, metadata)
    values (
      new.id,
      case when new.is_resubmission then 'resubmitted' else 'created' end,
      new.submitted_by,
      jsonb_build_object(
        'submission_type', new.submission_type,
        'attempt_number', new.attempt_number,
        'is_resubmission', new.is_resubmission,
        'link_url', new.link_url,
        'file_path', new.file_path,
        'comment', new.comment
      )
    );

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.submission_events (submission_id, event_type, actor_id, metadata)
      values (
        new.id,
        case new.status
          when 'changes_requested' then 'changes_requested'
          when 'approved' then 'approved'
          when 'rejected' then 'rejected'
          else 'reviewed'
        end,
        coalesce(new.reviewed_by, new.submitted_by),
        jsonb_build_object(
          'from_status', old.status,
          'to_status', new.status
        )
      );
    end if;
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_submission_events_on_submission_change on public.submissions;
create trigger trg_submission_events_on_submission_change
after insert or update on public.submissions
for each row
execute function public.submission_events_on_submission_change();

create or replace function public.submission_events_on_feedback_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.submission_events (submission_id, event_type, actor_id, metadata)
  values (
    new.submission_id,
    'feedback_added',
    new.actor_id,
    jsonb_build_object(
      'feedback_id', new.id,
      'score', new.score,
      'score_max', new.score_max
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_submission_events_on_feedback_insert on public.submission_feedback;
create trigger trg_submission_events_on_feedback_insert
after insert on public.submission_feedback
for each row
execute function public.submission_events_on_feedback_insert();

create or replace view public.submission_latest_feedback_v as
select distinct on (sf.submission_id)
  sf.submission_id,
  sf.id as feedback_id,
  sf.actor_id,
  sf.comment,
  sf.score,
  sf.score_max,
  sf.created_at
from public.submission_feedback sf
order by sf.submission_id, sf.created_at desc;

-- ---------------------------------------------------------------------------
-- Notificaciones (fan-out por usuario)
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.notification_target_type not null default 'user',
  team_id uuid null references public.program_edition_teams(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  source text null,
  read_at timestamptz null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_read_created_desc
  on public.notifications (user_id, read_at, created_at desc);

create index if not exists idx_notifications_team
  on public.notifications (team_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

create or replace function public.notify_team_members_fanout(
  p_team_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_payload jsonb default '{}'::jsonb,
  p_source text default null,
  p_created_by uuid default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  with inserted as (
    insert into public.notifications (
      user_id,
      target_type,
      team_id,
      type,
      title,
      body,
      payload,
      source,
      created_by
    )
    select distinct
      a.applicant_profile_id,
      'team'::public.notification_target_type,
      p_team_id,
      p_type,
      p_title,
      p_body,
      p_payload,
      p_source,
      p_created_by
    from public.applications a
    where a.team_id = p_team_id
      and a.status = 'enrolled'
    returning 1
  )
  select count(*) into v_count from inserted;

  return v_count;
end;
$$;

create or replace function public.notify_docentes_and_admins_fanout(
  p_team_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_payload jsonb default '{}'::jsonb,
  p_source text default null,
  p_created_by uuid default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  with recipients as (
    select distinct dta.docente_profile_id as user_id
    from public.docente_team_assignments dta
    where dta.team_id = p_team_id
      and dta.is_active = true
    union
    select p.id as user_id
    from public.profiles p
    where p.role in ('super_admin', 'admin')
      and coalesce(p.is_active, true) = true
  ),
  inserted as (
    insert into public.notifications (
      user_id,
      target_type,
      team_id,
      type,
      title,
      body,
      payload,
      source,
      created_by
    )
    select
      r.user_id,
      'team'::public.notification_target_type,
      p_team_id,
      p_type,
      p_title,
      p_body,
      p_payload,
      p_source,
      p_created_by
    from recipients r
    returning 1
  )
  select count(*) into v_count from inserted;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Actividad / inactividad
-- ---------------------------------------------------------------------------

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid null references public.programs(id) on delete set null,
  edition_id uuid null references public.program_editions(id) on delete set null,
  team_id uuid null references public.program_edition_teams(id) on delete set null,
  activity_type text not null,
  route text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activity_logs_user_created_desc
  on public.user_activity_logs (user_id, created_at desc);

create table if not exists public.user_last_seen (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  last_relevant_activity_at timestamptz not null default now(),
  last_route text null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_last_seen_last_relevant_activity
  on public.user_last_seen (last_relevant_activity_at);

drop trigger if exists trg_user_last_seen_updated_at on public.user_last_seen;
create trigger trg_user_last_seen_updated_at
before update on public.user_last_seen
for each row
execute function public.set_updated_at();

create table if not exists public.activity_alert_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_level text not null default 'active' check (
    current_level in ('active', 'low_activity', 'inactive', 'critical_inactive')
  ),
  last_alerted_at timestamptz null,
  last_recovered_at timestamptz null,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_activity_alert_state_updated_at on public.activity_alert_state;
create trigger trg_activity_alert_state_updated_at
before update on public.activity_alert_state
for each row
execute function public.set_updated_at();

create or replace function public.touch_user_activity(
  p_user_id uuid,
  p_activity_type text default 'heartbeat',
  p_route text default null,
  p_program_id uuid default null,
  p_edition_id uuid default null,
  p_team_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_last_seen (
    user_id,
    last_seen_at,
    last_relevant_activity_at,
    last_route
  )
  values (
    p_user_id,
    now(),
    now(),
    p_route
  )
  on conflict (user_id) do update
  set
    last_seen_at = excluded.last_seen_at,
    last_relevant_activity_at = excluded.last_relevant_activity_at,
    last_route = excluded.last_route,
    updated_at = now();

  update public.profiles
  set
    last_relevant_activity_at = now(),
    last_login_at = coalesce(last_login_at, now()),
    updated_at = now()
  where id = p_user_id;

  if p_activity_type is not null then
    insert into public.user_activity_logs (
      user_id,
      program_id,
      edition_id,
      team_id,
      activity_type,
      route,
      metadata
    )
    values (
      p_user_id,
      p_program_id,
      p_edition_id,
      p_team_id,
      p_activity_type,
      p_route,
      coalesce(p_metadata, '{}'::jsonb)
    );
  end if;
end;
$$;

create or replace function public.compute_activity_level(
  p_last_relevant_activity_at timestamptz,
  p_now timestamptz default now(),
  p_low_days int default 3,
  p_inactive_days int default 7,
  p_critical_days int default 14
)
returns text
language sql
immutable
as $$
  select case
    when p_last_relevant_activity_at is null then 'critical_inactive'
    when p_last_relevant_activity_at >= (p_now - make_interval(days => p_low_days)) then 'active'
    when p_last_relevant_activity_at >= (p_now - make_interval(days => p_inactive_days)) then 'low_activity'
    when p_last_relevant_activity_at >= (p_now - make_interval(days => p_critical_days)) then 'inactive'
    else 'critical_inactive'
  end;
$$;

create or replace function public.process_inactivity_alerts(
  p_low_days int default 3,
  p_inactive_days int default 7,
  p_critical_days int default 14,
  p_actor_id uuid default null
)
returns table (
  target_user_id uuid,
  previous_level text,
  next_level text,
  alert_sent boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_prev_level text;
  v_next_level text;
  v_should_alert boolean;
  v_title text;
  v_body text;
begin
  for r in
    select
      p.id as user_id,
      p.role::text as role,
      coalesce(
        uls.last_relevant_activity_at,
        p.last_relevant_activity_at,
        p.last_login_at,
        p.updated_at,
        p.created_at
      ) as last_relevant_activity_at
    from public.profiles p
    left join public.user_last_seen uls on uls.user_id = p.id
    where coalesce(p.is_active, true) = true
      and p.role in ('talent', 'docente')
  loop
    v_next_level := public.compute_activity_level(
      r.last_relevant_activity_at,
      now(),
      p_low_days,
      p_inactive_days,
      p_critical_days
    );

    select aas.current_level
    into v_prev_level
    from public.activity_alert_state aas
    where aas.user_id = r.user_id;

    v_should_alert := false;

    if v_next_level <> 'active' then
      if v_prev_level is null or v_prev_level = 'active' or v_prev_level <> v_next_level then
        v_should_alert := true;
      end if;
    end if;

    insert into public.activity_alert_state (user_id, current_level, last_alerted_at, last_recovered_at)
    values (
      r.user_id,
      v_next_level,
      case when v_should_alert then now() else null end,
      case when v_next_level = 'active' and v_prev_level is not null and v_prev_level <> 'active' then now() else null end
    )
    on conflict (user_id) do update
    set
      current_level = excluded.current_level,
      last_alerted_at = case
        when v_should_alert then now()
        else public.activity_alert_state.last_alerted_at
      end,
      last_recovered_at = case
        when excluded.current_level = 'active'
         and public.activity_alert_state.current_level <> 'active'
        then now()
        else public.activity_alert_state.last_recovered_at
      end,
      updated_at = now();

    if v_should_alert then
      v_title := 'Inactividad detectada';
      v_body := format(
        'El usuario %s lleva inactivo y cambió al nivel %s.',
        r.user_id::text,
        v_next_level
      );

      -- Super admins / admins
      insert into public.notifications (
        user_id, target_type, type, title, body, payload, source, created_by
      )
      select
        p.id,
        'user'::public.notification_target_type,
        'activity_alert',
        v_title,
        v_body,
        jsonb_build_object(
          'target_user_id', r.user_id,
          'level', v_next_level,
          'role', r.role
        ),
        'activity-monitor',
        p_actor_id
      from public.profiles p
      where p.role in ('super_admin', 'admin')
        and coalesce(p.is_active, true) = true;

      -- Docentes del equipo (solo para talento)
      if r.role = 'talent' then
        insert into public.notifications (
          user_id, target_type, team_id, type, title, body, payload, source, created_by
        )
        select distinct
          dta.docente_profile_id,
          'team'::public.notification_target_type,
          a.team_id,
          'activity_alert_student',
          'Inactividad de estudiante',
          v_body,
          jsonb_build_object(
            'target_user_id', r.user_id,
            'team_id', a.team_id,
            'level', v_next_level
          ),
          'activity-monitor',
          p_actor_id
        from public.applications a
        join public.docente_team_assignments dta
          on dta.team_id = a.team_id
         and dta.is_active = true
        where a.applicant_profile_id = r.user_id
          and a.team_id is not null
          and a.status = 'enrolled';
      end if;
    end if;

    target_user_id := r.user_id;
    previous_level := v_prev_level;
    next_level := v_next_level;
    alert_sent := v_should_alert;
    return next;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: enfoque soportado por Supabase (sin ALTER/TRIGGER en storage.objects)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-submissions',
  'task-submissions',
  false,
  26214400,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Nota:
-- - No se realizan ALTER TABLE ni TRIGGER sobre storage.objects porque requieren
--   ownership especial y rompen db push en entornos administrados.
-- - Se mantiene el bucket privado + policies para bloquear acceso cliente
--   autenticado; las subidas y signed URLs quedan en backend/service role.

drop policy if exists task_submissions_no_select on storage.objects;
create policy task_submissions_no_select
on storage.objects
for select
to authenticated
using (bucket_id = 'task-submissions' and false);

drop policy if exists task_submissions_no_insert on storage.objects;
create policy task_submissions_no_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'task-submissions' and false);

drop policy if exists task_submissions_no_update on storage.objects;
create policy task_submissions_no_update
on storage.objects
for update
to authenticated
using (bucket_id = 'task-submissions' and false)
with check (bucket_id = 'task-submissions' and false);

drop policy if exists task_submissions_no_delete on storage.objects;
create policy task_submissions_no_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'task-submissions' and false);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.professional_areas enable row level security;
alter table public.team_schedule_slots enable row level security;
alter table public.docente_team_assignments enable row level security;
alter table public.task_templates enable row level security;
alter table public.task_assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_feedback enable row level security;
alter table public.submission_events enable row level security;
alter table public.notifications enable row level security;
alter table public.user_activity_logs enable row level security;
alter table public.user_last_seen enable row level security;
alter table public.activity_alert_state enable row level security;

drop policy if exists professional_areas_select_all on public.professional_areas;
create policy professional_areas_select_all
on public.professional_areas
for select
to authenticated
using (true);

drop policy if exists professional_areas_manage_admin on public.professional_areas;
drop policy if exists professional_areas_no_client_writes on public.professional_areas;
create policy professional_areas_no_client_writes
on public.professional_areas
for all
to authenticated
using (false)
with check (false);

drop policy if exists team_schedule_slots_select_scope on public.team_schedule_slots;
create policy team_schedule_slots_select_scope
on public.team_schedule_slots
for select
to authenticated
using (public.app_can_view_team(auth.uid(), team_id));

drop policy if exists team_schedule_slots_manage_admin on public.team_schedule_slots;
drop policy if exists team_schedule_slots_no_client_writes on public.team_schedule_slots;
create policy team_schedule_slots_no_client_writes
on public.team_schedule_slots
for all
to authenticated
using (false)
with check (false);

drop policy if exists docente_team_assignments_select_scope on public.docente_team_assignments;
create policy docente_team_assignments_select_scope
on public.docente_team_assignments
for select
to authenticated
using (
  public.app_is_admin_level(auth.uid())
  or docente_profile_id = auth.uid()
);

drop policy if exists docente_team_assignments_manage_admin on public.docente_team_assignments;
drop policy if exists docente_team_assignments_no_client_writes on public.docente_team_assignments;
create policy docente_team_assignments_no_client_writes
on public.docente_team_assignments
for all
to authenticated
using (false)
with check (false);

drop policy if exists task_templates_select_staff on public.task_templates;
create policy task_templates_select_staff
on public.task_templates
for select
to authenticated
using (
  public.app_is_admin_level(auth.uid())
  or public.app_is_docente(auth.uid())
);

drop policy if exists task_templates_manage_staff on public.task_templates;
drop policy if exists task_templates_no_client_writes on public.task_templates;
create policy task_templates_no_client_writes
on public.task_templates
for all
to authenticated
using (false)
with check (false);

drop policy if exists task_assignments_select_scope on public.task_assignments;
create policy task_assignments_select_scope
on public.task_assignments
for select
to authenticated
using (
  public.app_is_admin_level(auth.uid())
  or public.app_is_docente_assigned(auth.uid(), team_id)
  or public.app_is_team_member(auth.uid(), team_id)
);

drop policy if exists task_assignments_manage_scope on public.task_assignments;
drop policy if exists task_assignments_no_client_writes on public.task_assignments;
create policy task_assignments_no_client_writes
on public.task_assignments
for all
to authenticated
using (false)
with check (false);

drop policy if exists submissions_select_scope on public.submissions;
create policy submissions_select_scope
on public.submissions
for select
to authenticated
using (
  public.app_is_admin_level(auth.uid())
  or public.app_is_docente_assigned(auth.uid(), team_id)
  or (
    submission_scope = 'team'
    and public.app_is_team_member(auth.uid(), team_id)
  )
  or (
    submission_scope = 'individual'
    and owner_profile_id = auth.uid()
  )
);

drop policy if exists submission_feedback_select_scope on public.submission_feedback;
create policy submission_feedback_select_scope
on public.submission_feedback
for select
to authenticated
using (
  exists (
    select 1
    from public.submissions s
    where s.id = submission_feedback.submission_id
      and (
        public.app_is_admin_level(auth.uid())
        or public.app_is_docente_assigned(auth.uid(), s.team_id)
        or (s.submission_scope = 'team' and public.app_is_team_member(auth.uid(), s.team_id))
        or (s.submission_scope = 'individual' and s.owner_profile_id = auth.uid())
      )
  )
);

drop policy if exists submission_events_select_scope on public.submission_events;
create policy submission_events_select_scope
on public.submission_events
for select
to authenticated
using (
  exists (
    select 1
    from public.submissions s
    where s.id = submission_events.submission_id
      and (
        public.app_is_admin_level(auth.uid())
        or public.app_is_docente_assigned(auth.uid(), s.team_id)
        or (s.submission_scope = 'team' and public.app_is_team_member(auth.uid(), s.team_id))
        or (s.submission_scope = 'individual' and s.owner_profile_id = auth.uid())
      )
  )
);

drop policy if exists notifications_select_own_or_admin on public.notifications;
create policy notifications_select_own_or_admin
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
  or public.app_is_admin_level(auth.uid())
);

drop policy if exists user_activity_logs_select_scope on public.user_activity_logs;
create policy user_activity_logs_select_scope
on public.user_activity_logs
for select
to authenticated
using (
  user_id = auth.uid()
  or public.app_is_admin_level(auth.uid())
  or exists (
    select 1
    from public.applications a
    join public.docente_team_assignments dta
      on dta.team_id = a.team_id
     and dta.docente_profile_id = auth.uid()
     and dta.is_active = true
    where a.applicant_profile_id = user_activity_logs.user_id
      and a.status = 'enrolled'
  )
);

drop policy if exists user_last_seen_select_scope on public.user_last_seen;
create policy user_last_seen_select_scope
on public.user_last_seen
for select
to authenticated
using (
  user_id = auth.uid()
  or public.app_is_admin_level(auth.uid())
  or exists (
    select 1
    from public.applications a
    join public.docente_team_assignments dta
      on dta.team_id = a.team_id
     and dta.docente_profile_id = auth.uid()
     and dta.is_active = true
    where a.applicant_profile_id = user_last_seen.user_id
      and a.status = 'enrolled'
  )
);

drop policy if exists activity_alert_state_select_admin on public.activity_alert_state;
create policy activity_alert_state_select_admin
on public.activity_alert_state
for select
to authenticated
using (public.app_is_admin_level(auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants funciones
-- ---------------------------------------------------------------------------

grant execute on function public.app_current_role(uuid) to authenticated;
grant execute on function public.app_is_admin_level(uuid) to authenticated;
grant execute on function public.app_is_super_admin(uuid) to authenticated;
grant execute on function public.app_is_docente(uuid) to authenticated;
grant execute on function public.app_is_team_member(uuid, uuid) to authenticated;
grant execute on function public.app_is_docente_assigned(uuid, uuid) to authenticated;
grant execute on function public.app_can_manage_team(uuid, uuid) to authenticated;
grant execute on function public.app_can_view_team(uuid, uuid) to authenticated;
grant execute on function public.get_docente_assignment_conflicts(uuid, uuid, uuid) to authenticated;
grant execute on function public.touch_user_activity(uuid, text, text, uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function public.notify_team_members_fanout(uuid, text, text, text, jsonb, text, uuid) to authenticated;
grant execute on function public.notify_docentes_and_admins_fanout(uuid, text, text, text, jsonb, text, uuid) to authenticated;
grant execute on function public.process_inactivity_alerts(int, int, int, uuid) to authenticated;
