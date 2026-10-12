-- Boudoir admission by visitor code (the IP-derived, privacy-preserving id),
-- replacing the Apple-account board. The passphrase is still the real lock on
-- the pictures; this is the "who is let past the Under-review card" layer.
--
-- A visitor is identified by the 6-char prefix of their scrambled code (the
-- same handle the visitor book and names use). Editors (Molly, signed into the
-- catalogue) are always admitted.

create table if not exists public.palais_boudoir_members (
  visitor text primary key,          -- the 6-char visitor prefix
  admitted boolean not null default true,
  city text,
  added_at timestamptz not null default now()
);
alter table public.palais_boudoir_members enable row level security;
-- no public policies: only the security-definer functions below ever touch it

-- the visitor prefix behind a session (their most recent visit under it)
create or replace function public.palais_session_visitor(p_session text)
returns text language sql stable security definer set search_path = '' as $$
  select left(visitor, 6) from public.palais_visits
  where session = p_session and visitor is not null
  order by created_at desc limit 1
$$;

-- is the caller (by their session) admitted to the Boudoir? editors always are.
create or replace function public.palais_boudoir_accepted(p_session text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v text;
begin
  if public.palais_is_editor() then return true; end if;
  v := public.palais_session_visitor(p_session);
  if v is null then return false; end if;
  return exists (select 1 from public.palais_boudoir_members m where m.visitor = v and m.admitted);
end $$;

-- a visitor asks to be let in: note them as pending and buzz Molly once per 12h
create or replace function public.palais_boudoir_ask(p_session text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v text;
  c text;
  k text;
  last timestamptz;
begin
  v := public.palais_session_visitor(p_session);
  if v is null then return; end if;
  select city into c from public.palais_visits
    where session = p_session order by created_at desc limit 1;
  -- record them as pending (admitted = false), without clobbering an existing row
  insert into public.palais_boudoir_members (visitor, admitted, city)
    values (v, false, c)
    on conflict (visitor) do update
      set city = coalesce(public.palais_boudoir_members.city, excluded.city);
  -- buzz for review, throttled to once every 12h per visitor
  k := 'boudoir_ask_' || v;
  select value::timestamptz into last from public.palais_private where key = k;
  if last is null or now() - last > interval '12 hours' then
    perform public.palais_send_ping(
      'Please admit visitor ' || v || coalesce(' (' || c || ')', '') || ' to the Boudoir'
    );
    insert into public.palais_private (key, value) values (k, now()::text)
      on conflict (key) do update set value = excluded.value;
  end if;
end $$;

-- admit or revoke a visitor (editors only)
create or replace function public.palais_boudoir_admit(p_visitor text, p_ok boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.palais_is_editor() then raise exception 'editors only'; end if;
  insert into public.palais_boudoir_members (visitor, admitted)
    values (left(p_visitor, 6), p_ok)
    on conflict (visitor) do update set admitted = excluded.admitted;
end $$;

-- who has been let in / is waiting (editors only), for the admin
create or replace function public.palais_boudoir_members_list()
returns setof public.palais_boudoir_members
language sql stable security definer set search_path = '' as $$
  select * from public.palais_boudoir_members
  where public.palais_is_editor()
  order by admitted, added_at desc
$$;

-- grants: visitors may check and ask; only Molly may admit or list
revoke all on function public.palais_session_visitor(text) from public, anon, authenticated;
grant execute on function public.palais_boudoir_accepted(text) to anon, authenticated;
grant execute on function public.palais_boudoir_ask(text) to anon, authenticated;
revoke all on function public.palais_boudoir_admit(text, boolean) from public, anon;
grant execute on function public.palais_boudoir_admit(text, boolean) to authenticated;
revoke all on function public.palais_boudoir_members_list() from public, anon;
grant execute on function public.palais_boudoir_members_list() to authenticated;
