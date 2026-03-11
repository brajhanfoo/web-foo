begin;

alter table public.payments
add column if not exists checkout_url text null;

commit;

