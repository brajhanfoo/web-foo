-- 20260408_program_edition_milestones_docente_select_policy.sql
-- Correccion minima: permitir SELECT de hitos a docentes asignados al equipo.
-- No modifica politicas existentes de admin/participants.
-- No agrega permisos de escritura.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'program_edition_milestones'
      and policyname = 'docentes read assigned team milestones'
  ) then
    create policy "docentes read assigned team milestones"
    on public.program_edition_milestones
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.docente_team_assignments dta
        where dta.team_id = program_edition_milestones.team_id
          and dta.docente_profile_id = auth.uid()
          and coalesce(dta.is_active, true) = true
      )
    );
  end if;
end $$;
