-- A buzz when someone goes to sign in at the Boudoir dresser.
--
-- The dresser asks everyone to sign in (Apple) before the pictures. This just
-- records the attempt in the book (palais_visit_doings), so it shows in the
-- admin. The actual buzz waits until they are signed in and we know who they
-- are and whether the board still needs to see them — palais_review_ping
-- (20260928160000) sends "Please Accept <email>" then.
--
-- It is open to anon (a not-yet-signed-in visitor calls it), and only writes a
-- line — nothing to flood.
--
-- Run after 20260917120000_palais_visit_ping.sql (palais_send_ping) and
-- 20260917130000_palais_visit_doings.sql (palais_note_doing). Safe to re-run.

create or replace function public.palais_signin_attempt(p_session text, p_provider text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prov text := coalesce(nullif(trim(p_provider), ''), 'a provider');
begin
  -- just write it into the book (ignore if the doings table isn't there yet).
  -- The buzz is sent later, once they are actually signed in and we know who
  -- they are and whether they still need the board -- see palais_review_ping
  -- (20260928160000). A mere button tap tells us nothing to act on.
  begin
    perform public.palais_note_doing(p_session, 'sign-in', prov);
  exception when undefined_function then null; end;
end;
$$;

grant execute on function public.palais_signin_attempt(text, text) to anon, authenticated;
