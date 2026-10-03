-- "Please Accept <email>" — a buzz when someone who is signed in but not yet a
-- member is waiting on the board.
--
-- It fires from the account's own side, the moment the dresser learns the
-- board hasn't accepted them (palais_i_am_accepted came back false). By then
-- they are signed in, so we know their email. Editors are never pinged — they
-- are the board. It buzzes at most once every 12 hours per account, so a
-- reload or a second look doesn't re-ask.
--
-- It rides the visit ping channel (palais_set_visit_ping — ntfy, Discord…).
-- Run after 20260928150000_palais_members.sql and the visit ping. Re-runnable.

alter table public.palais_members add column if not exists review_pinged_at timestamptz;

create or replace function public.palais_review_ping()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  addr text;
  is_in boolean;
  pinged timestamptz;
begin
  if me is null then
    return;
  end if;
  if public.palais_is_editor() then
    return;                                  -- the board doesn't review itself
  end if;

  select email into addr from auth.users where id = me;

  -- make sure they have a row (stays not-accepted if it's new)
  insert into public.palais_members (id, accepted) values (me, false)
  on conflict (id) do nothing;

  select accepted, review_pinged_at into is_in, pinged
    from public.palais_members where id = me;
  if is_in then
    return;                                  -- already let in, nothing to ask
  end if;
  if pinged is not null and pinged > now() - interval '12 hours' then
    return;                                  -- asked recently; don't nag
  end if;

  update public.palais_members set review_pinged_at = now() where id = me;

  begin
    perform public.palais_send_ping('Please Accept ' || coalesce(addr, 'a new visitor'));
  exception when undefined_function then null; end;
end;
$$;

grant execute on function public.palais_review_ping() to authenticated;
