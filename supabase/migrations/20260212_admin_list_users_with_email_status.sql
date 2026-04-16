create or replace function public.admin_list_users_with_email_status()
returns table (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_active boolean,
  profile_status text,
  created_at timestamptz,
  email_confirmed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    p.id as user_id,
    coalesce(p.email, u.email) as email,
    p.first_name,
    p.last_name,
    p.role,
    p.is_active,
    p.profile_status,
    p.created_at,
    u.email_confirmed_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_users_with_email_status() from public;
grant execute on function public.admin_list_users_with_email_status() to authenticated;
