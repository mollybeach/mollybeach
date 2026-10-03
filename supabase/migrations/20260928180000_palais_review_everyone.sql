-- Let the board feel the rope too: editors now pass through the "under review"
-- gate like anyone else, decided by their own accepted flag rather than waved
-- straight through. Replaces palais_i_am_accepted from 20260928150000.
--
-- This can't lock you out: the admin page is gated by palais_is_editor (being
-- on the board), NOT by this flag, so an editor can always reach /admin and
-- Accept themselves — the dresser just shows the review screen until they do.
--
-- To go back to editors skipping the gate, restore the version in
-- 20260928150000_palais_members.sql (the `palais_is_editor() or …` one).
--
-- Run after 20260928150000_palais_members.sql. Safe to run more than once.

create or replace function public.palais_i_am_accepted()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select accepted from public.palais_members where id = auth.uid()), false);
$$;

grant execute on function public.palais_i_am_accepted() to authenticated;
