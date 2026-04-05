-- Canonical timezone for team schedule slots
-- Keep model flexible for other IANA zones, but default platform zone is Buenos Aires.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'team_schedule_slots'
      and column_name = 'timezone'
  ) then
    alter table public.team_schedule_slots
      alter column timezone set default 'America/Argentina/Buenos_Aires';
  end if;
end $$;

update public.team_schedule_slots
set
  timezone = 'America/Argentina/Buenos_Aires',
  updated_at = now()
where timezone = 'America/Guayaquil';
