-- 20260406_task_assignment_status_consistency.sql
-- Unifica consistencia de estado en task_assignments.
-- Fuente de verdad funcional: status.
-- Reglas:
-- - published => is_published=true, published_at informado, closed_at=NULL
-- - closed => is_published=false, closed_at informado
-- - draft/archived => is_published=false (draft limpia closed_at)

-- Backfill de consistencia para registros existentes.
update public.task_assignments
set
  is_published = true,
  published_at = coalesce(published_at, now()),
  closed_at = null
where status = 'published';

update public.task_assignments
set is_published = false
where status in ('draft', 'closed', 'archived');

update public.task_assignments
set closed_at = now()
where status = 'closed'
  and closed_at is null;

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
    new.closed_at := null;
    if new.published_at is null then
      new.published_at := now();
    end if;
  elsif new.status = 'closed' then
    new.is_published := false;
    if new.closed_at is null then
      new.closed_at := now();
    end if;
  elsif new.status = 'draft' then
    new.is_published := false;
    new.closed_at := null;
  elsif new.status = 'archived' then
    new.is_published := false;
  end if;

  if new.is_published = true and new.status = 'draft' then
    new.status := 'published';
    new.closed_at := null;
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
