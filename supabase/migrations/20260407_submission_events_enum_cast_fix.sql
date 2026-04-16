-- 20260407_submission_events_enum_cast_fix.sql
-- Corrige casting de event_type en triggers de submission_events.

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
      (
        case when new.is_resubmission then 'resubmitted' else 'created' end
      )::public.submission_event_type,
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
        (
          case new.status
            when 'changes_requested' then 'changes_requested'
            when 'approved' then 'approved'
            when 'rejected' then 'rejected'
            else 'reviewed'
          end
        )::public.submission_event_type,
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

create or replace function public.submission_events_on_feedback_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.submission_events (submission_id, event_type, actor_id, metadata)
  values (
    new.submission_id,
    'feedback_added'::public.submission_event_type,
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
