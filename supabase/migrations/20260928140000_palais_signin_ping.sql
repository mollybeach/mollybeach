-- A buzz when someone goes to sign in at the Boudoir dresser.
--
-- The dresser now asks everyone to sign in (Apple) before the pictures. This
-- records each attempt and sends one line to wherever the visit ping already
-- points — ntfy, Discord, whatever palais_set_visit_ping was given. No new
-- address to configure; it rides the channel that is already set up.
--
-- The attempt is logged as a "doing" too (palais_visit_doings), so it shows up
-- in the admin alongside the rest of the book.
--
-- It is called by a not-yet-signed-in visitor, so it is open to anon — which
-- means someone could poke it to make it buzz. A 60-second throttle keeps that
-- from becoming a flood: at most one sign-in ping a minute, however many times
-- it is called.
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
  last_at timestamptz;
begin
  -- write it into the book (ignore if the doings table isn't there yet)
  begin
    perform public.palais_note_doing(p_session, 'sign-in', prov);
  exception when undefined_function then null; end;

  -- at most one sign-in buzz a minute
  select value::timestamptz into last_at
    from public.palais_private where key = 'signin_ping_last';
  if last_at is not null and last_at > now() - interval '60 seconds' then
    return;
  end if;
  insert into public.palais_private (key, value) values ('signin_ping_last', now()::text)
  on conflict (key) do update set value = excluded.value;

  -- buzz whatever the visit ping points at
  begin
    perform public.palais_send_ping('Someone is signing in with ' || initcap(prov) || ' at the dresser');
  exception when undefined_function then null; end;
end;
$$;

grant execute on function public.palais_signin_attempt(text, text) to anon, authenticated;
