-- 20260404_task_assignments_allowed_submission_type.sql
-- Configura tipo de entrega permitido por task_assignment (link|file|both)
-- y lo valida en submissions.

alter table public.task_assignments
  add column if not exists allowed_submission_type public.submission_type;

update public.task_assignments
set allowed_submission_type = 'both'::public.submission_type
where allowed_submission_type is null;

alter table public.task_assignments
  alter column allowed_submission_type set default 'both'::public.submission_type;

alter table public.task_assignments
  alter column allowed_submission_type set not null;

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
    ta.allowed_submission_type,
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

  if v_assignment.allowed_submission_type = 'link'
     and new.submission_type <> 'link' then
    raise exception 'submission_type debe ser link para esta tarea';
  end if;

  if v_assignment.allowed_submission_type = 'file'
     and new.submission_type <> 'file' then
    raise exception 'submission_type debe ser file para esta tarea';
  end if;

  if v_assignment.allowed_submission_type = 'both'
     and new.submission_type <> 'both' then
    raise exception 'submission_type debe ser both para esta tarea';
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
