-- Every Molly is me.
--
-- A visitor is a salted hash of an IP address, and Molly's address keeps
-- changing — a new carrier, a new café, a phone that has wandered onto
-- another tower — so she arrives as a new six-character code every few days
-- and has to name herself Molly all over again.
--
-- Two things stood in the way of those new codes being hidden behind
-- "Show my own visits":
--
--   1. palais_name_visitor (20260915120000) held that only ONE visitor could
--      ever be Molly: marking one un-marked every other. Her own history was
--      forever collapsing onto whichever code she named last.
--   2. Nothing tied the NAME to the mark, so naming a code "Molly" left
--      is_me false and the visits stayed in the feed.
--
-- So: the mark is no longer exclusive, and the name now carries it. Name a
-- visitor Molly — in any casing, with any stray spaces — and they join the
-- group the toggle hides. Name them something else and the mark comes off,
-- unless the editor asks for it outright.
--
-- Everything that reads is_me already expected a group rather than a single
-- row (palais_visit_stats, palais_front_doors and palais_all_the_cities all
-- gather `array(select prefix ... where is_me)`), so nothing downstream has
-- to change.
--
-- Run after 20260915120000_palais_visitor_id.sql. Safe to run more than once.

/* ------------------------------------------------ the name carries the mark */

create or replace function public.palais_name_visitor(p_prefix text, p_name text, p_is_me boolean default false, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text;
  mine boolean;
begin
  if not public.palais_is_editor() then
    raise exception 'only editors can name visitors';
  end if;
  if p_prefix !~ '^[0-9a-f]{6}$' then
    raise exception 'a visitor code is six characters of 0-9 and a-f';
  end if;

  clean := left(trim(p_name), 40);
  if nullif(clean, '') is null then
    delete from public.palais_visitor_names where prefix = p_prefix;
    return;
  end if;

  -- anyone called Molly is Molly, however it was typed. The flag still works
  -- on its own, for the days she is signed in under some other name.
  mine := coalesce(p_is_me, false) or lower(clean) = 'molly';

  insert into public.palais_visitor_names (prefix, name, is_me, note)
  values (p_prefix, clean, mine, left(nullif(trim(p_note), ''), 200))
  on conflict (prefix) do update
    set name = excluded.name,
        is_me = excluded.is_me,
        note = coalesce(excluded.note, public.palais_visitor_names.note),
        updated_at = now();
end;
$$;

-- unchanged from 20260915120000, restated because create-or-replace keeps the
-- old grants but this file may be run against a database that never had them
grant execute on function public.palais_name_visitor(text, text, boolean, text) to authenticated;

/* --------------------------------------- the ones already named, caught up */

update public.palais_visitor_names
   set is_me = true, updated_at = now()
 where lower(trim(name)) = 'molly'
   and not is_me;
