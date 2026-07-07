-- ════════════════════════════════════════════════════════════════════════════
-- 009 — enforce_ots_order: permit non-status updates (owner assignment)
--
-- GOV §3.6 defines the onboarding_task_status statechart over the STATUS
-- column: all 6 off-diagonal status pairs are legal, the 3 self-loops are
-- illegal. `assigned_to` routes outside the status edges (contract C1-assign:
-- admin assigns an owner without touching status).
--
-- The shipped trigger raised on ANY update whose status was unchanged, which
-- wrongly rejected assigned_to-only PATCHes (admin owner assignment failed at
-- the DB). Fix: an update that leaves status unchanged is only illegal when it
-- changes nothing else either (a true self-loop / no-op status write); if any
-- non-status column changed, it is not a status transition and passes through.
-- The manager column-freeze trigger (004) still independently restricts WHO
-- may write which columns.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.enforce_ots_order()
returns trigger
language plpgsql
as $function$
begin
  if new.status is not distinct from old.status then
    if new.assigned_to  is not distinct from old.assigned_to
       and new.started_at   is not distinct from old.started_at
       and new.completed_at is not distinct from old.completed_at
       and new.completed_by is not distinct from old.completed_by then
      raise exception 'Illegal onboarding task transition: % -> % (a status write must change the status)',
        old.status, new.status;
    end if;
    -- non-status field update (e.g. owner assignment) — not a status edge
    return new;
  end if;
  -- every off-diagonal status pair is legal per §3.6; self-loops handled above.
  return new;
end $function$;
