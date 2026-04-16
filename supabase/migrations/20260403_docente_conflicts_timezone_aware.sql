-- Make docente-team schedule conflict detection timezone-aware.
-- Works with IANA zones stored in team_schedule_slots.timezone.

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
    select
      ts.day_of_week,
      ts.start_time,
      ts.end_time,
      ts.timezone,
      (((date '2024-01-07' + ts.day_of_week) + ts.start_time) at time zone ts.timezone) as utc_start_at,
      (((date '2024-01-07' + ts.day_of_week) + ts.end_time) at time zone ts.timezone) as utc_end_at
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
  ),
  docente_slots as (
    select
      da.id as conflict_assignment_id,
      da.team_id as conflict_team_id,
      t.name as conflict_team_name,
      ts.day_of_week,
      ts.start_time,
      ts.end_time,
      ts.timezone,
      (((date '2024-01-07' + ts.day_of_week) + ts.start_time) at time zone ts.timezone) as utc_start_at,
      (((date '2024-01-07' + ts.day_of_week) + ts.end_time) at time zone ts.timezone) as utc_end_at
    from docente_assignments da
    join public.program_edition_teams t on t.id = da.team_id
    join public.team_schedule_slots ts on ts.team_id = da.team_id and ts.is_active = true
  )
  select
    ds.conflict_assignment_id,
    ds.conflict_team_id,
    ds.conflict_team_name,
    ds.day_of_week,
    ds.start_time,
    ds.end_time
  from docente_slots ds
  join target_slots trg
    on ds.utc_start_at < trg.utc_end_at
   and trg.utc_start_at < ds.utc_end_at;
$$;
