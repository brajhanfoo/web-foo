begin;

-- 1) Clear stale error messages on successful Mercado Pago payments.
update public.payments
set
  error_message = null,
  updated_at = now()
where provider = 'mercado_pago'::payment_provider
  and status = 'paid'::payment_status
  and error_message is not null;

-- 2) Backfill preference_id from raw_preference_response when available.
update public.mercadopago_payments
set
  preference_id = nullif(raw_preference_response ->> 'id', ''),
  updated_at = now()
where preference_id is null
  and raw_preference_response is not null
  and nullif(raw_preference_response ->> 'id', '') is not null;

commit;

