-- A buzz on Molly's phone when someone opens the Palais.
--
-- Every visit already lands in palais_visits (20260913130000_palais_visits.sql).
-- This hangs a trigger on that table which posts one line somewhere — ntfy,
-- Discord, Slack, anything that takes a JSON POST — using pg_net, which hands
-- the request to a background worker, so the visitor's page never waits on it.
--
-- Nothing about this is public. Where to post is kept in palais_private, the
-- same table that holds the visit salt, which has no policies at all: the site
-- can't read it, only these security-definer functions can. The message is
-- city-level, the same as everything else in the visitor book — no addresses.
--
-- Molly's own visits never ping (palais_visitor_names.is_me), and by default
-- only someone the log has never seen before does, so a busy day is one buzz a
-- person rather than one a page. Anyone she has named in palais_visitor_names
-- is the exception: friends ping by name every time they come back, and the
-- quiet gap doesn't hold them back either, which is the part worth being told
-- about.
--
-- Your own visits are quiet by default. While you're testing, turn them on:
--   select palais_set_ping_me(true);   -- and false again when you're done
--
-- Turn it on from the SQL editor, either as a push notification:
--   select palais_set_visit_ping('https://ntfy.sh/your-secret-topic');
-- or as an actual text message, through textbelt.com (a few cents each; the
-- number is kept here, never in the repo):
--   select palais_set_visit_sms('2065550123', 'your-textbelt-key');
--   select palais_visit_ping_test();     -- your phone should buzz
--   select palais_visit_ping_status();   -- what's set, and when it last fired
--   select palais_set_visit_ping(null);  -- off again
--
-- Safe to run more than once.

-- pg_net is what does the posting. The dashboard is the usual way to turn it
-- on (Database → Extensions → pg_net); this is only here so the file stands on
-- its own, and it says so rather than failing if the role may not.
do $$
begin
  create extension if not exists pg_net;
exception
  when others then
    raise notice 'pg_net could not be enabled here (%). Turn it on in Database → Extensions, then run this file again.', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------- settings --

-- Who may set this up. palais_is_editor() asks who is signed in, which is the
-- right question from the site — but the SQL editor connects as the database
-- owner with nobody signed in at all, and that is Molly at the keyboard too.
create or replace function public.palais_may_ping()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- session_user is the role that connected, and stays that way inside a
  -- security definer function, unlike current_user
  select public.palais_is_editor() or session_user in ('postgres', 'supabase_admin')
$$;
revoke all on function public.palais_may_ping() from public, anon;
grant execute on function public.palais_may_ping() to authenticated;

create or replace function public.palais_set_visit_ping(
  p_url text,
  p_kind text default 'ntfy',       -- ntfy | textbelt | discord | slack | raw
  p_who text default 'new',         -- new = first time only, all = every visit
  p_quiet_minutes int default 5     -- never more than one ping in this many minutes
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can set the visit ping';
  end if;

  if p_url is null or trim(p_url) = '' then
    delete from public.palais_private where key like 'visit_ping%';
    return;
  end if;

  if p_url !~ '^https://' then
    raise exception 'the ping has to go somewhere over https';
  end if;
  if p_kind not in ('ntfy', 'textbelt', 'discord', 'slack', 'raw') then
    raise exception 'kind must be ntfy, textbelt, discord, slack or raw';
  end if;
  if p_who not in ('new', 'all') then
    raise exception 'who must be new or all';
  end if;

  insert into public.palais_private (key, value) values
    ('visit_ping_url', trim(p_url)),
    ('visit_ping_kind', p_kind),
    ('visit_ping_who', p_who),
    ('visit_ping_quiet', greatest(0, least(p_quiet_minutes, 1440))::text)
  on conflict (key) do update set value = excluded.value;
end;
$$;

-- The same thing, sent as a text. textbelt.com takes a plain JSON POST, which
-- is all pg_net can do; Twilio and the like want form-encoded bodies with
-- basic auth and would need an edge function in between.
--
-- The key 'textbelt' is their free one — one text a day per IP address, and
-- the IP here belongs to Supabase and is shared, so treat it as a lottery.
-- 'textbelt_test' always says it worked without sending anything, which is the
-- one to use while checking the plumbing. A real key is bought at textbelt.com.
create or replace function public.palais_set_visit_sms(
  p_phone text,
  p_key text default 'textbelt_test',
  p_who text default 'new',
  p_quiet_minutes int default 5
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can set the visit ping';
  end if;
  if length(digits) not between 10 and 15 then
    raise exception 'that does not look like a phone number';
  end if;

  perform public.palais_set_visit_ping('https://textbelt.com/text', 'textbelt', p_who, p_quiet_minutes);
  insert into public.palais_private (key, value) values
    ('visit_ping_phone', digits),
    ('visit_ping_sms_key', coalesce(nullif(trim(p_key), ''), 'textbelt_test'))
  on conflict (key) do update set value = excluded.value;
end;
$$;

-- Whether Molly's own visits ping. Off is the sane setting — otherwise every
-- time she opens her own site her phone goes off — but it wants to be on while
-- she's testing that any of this works at all.
create or replace function public.palais_set_ping_me(p_on boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can set the visit ping';
  end if;
  insert into public.palais_private (key, value) values ('visit_ping_me', case when p_on then 'on' else 'off' end)
  on conflict (key) do update set value = excluded.value;
end;
$$;
revoke all on function public.palais_set_ping_me(boolean) from public, anon;
grant execute on function public.palais_set_ping_me(boolean) to authenticated;

create or replace function public.palais_visit_ping_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  url text;
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can see the visit ping';
  end if;

  select value into url from public.palais_private where key = 'visit_ping_url';
  return jsonb_build_object(
    'on', url is not null,
    -- the host only: the rest of an ntfy address is the secret part of it
    'to', case when url is null then null else substring(url from '^https://[^/]+') || '/…' end,
    'kind', (select value from public.palais_private where key = 'visit_ping_kind'),
    'who', (select value from public.palais_private where key = 'visit_ping_who'),
    'phone', (select '••• ••• ' || right(value, 4) from public.palais_private where key = 'visit_ping_phone'),
    'pings_me', coalesce((select value from public.palais_private where key = 'visit_ping_me'), 'off'),
    'quiet_minutes', (select value from public.palais_private where key = 'visit_ping_quiet'),
    'last_sent', (select value from public.palais_private where key = 'visit_ping_last')
  );
end;
$$;

-- ------------------------------------------------------------- the posting --

-- pg_net lives in a different schema depending on how it was installed, so the
-- function is found by name rather than assumed to be net.http_post.
create or replace function public.palais_send_ping(p_message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  url text;
  kind text;
  target text;
  body jsonb;
  where_net text;
begin
  select value into url from public.palais_private where key = 'visit_ping_url';
  if url is null then
    return;
  end if;
  select coalesce(value, 'ntfy') into kind from public.palais_private where key = 'visit_ping_kind';

  target := url;
  if kind = 'ntfy' then
    -- ntfy takes the topic in the body, so the message stays plain text
    target := substring(url from '^https://[^/]+');
    body := jsonb_build_object(
      'topic', regexp_replace(url, '^https://[^/]+/', ''),
      'title', 'The Palais',
      'message', p_message,
      'tags', jsonb_build_array('cherry_blossom')
    );
  elsif kind = 'textbelt' then
    target := 'https://textbelt.com/text';
    body := jsonb_build_object(
      'phone', (select value from public.palais_private where key = 'visit_ping_phone'),
      -- one '·' would make the whole text unicode, which halves how much fits
      -- in a single message and so doubles what it costs to send
      'message', replace(p_message, ' · ', ' - '),
      'key', coalesce((select value from public.palais_private where key = 'visit_ping_sms_key'), 'textbelt_test')
    );
  elsif kind = 'discord' then
    body := jsonb_build_object('content', p_message);
  elsif kind = 'slack' then
    body := jsonb_build_object('text', p_message);
  else
    body := jsonb_build_object('message', p_message);
  end if;

  select n.nspname into where_net
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'http_post'
  order by case when n.nspname = 'net' then 0 else 1 end
  limit 1;

  if where_net is null then
    raise notice 'pg_net is not installed, so nothing was sent';
    return;
  end if;

  execute format('select %I.http_post(url := $1, body := $2, headers := $3)', where_net)
    using target, body, '{"Content-Type": "application/json"}'::jsonb;

  insert into public.palais_private (key, value) values ('visit_ping_last', now()::text)
  on conflict (key) do update set value = excluded.value;
end;
$$;

create or replace function public.palais_visit_ping_test()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can test the visit ping';
  end if;
  if not exists (select 1 from public.palais_private where key = 'visit_ping_url') then
    return 'nowhere to send it — call palais_set_visit_ping first';
  end if;
  perform public.palais_send_ping('Kate (Seattle, Washington) just opened the Palais · iPhone · from Instagram (this one is a test)');
  return 'sent';
end;
$$;

-- --------------------------------------------------------------- the trigger --

create or replace function public.palais_visit_ping()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  who text;
  quiet int;
  last timestamptz;
  known text;
  mine boolean := false;
  place text;
  gear text;
  came text;
begin
  if not exists (select 1 from public.palais_private where key = 'visit_ping_url') then
    return new;
  end if;

  -- is this someone she has already put a name to?
  if new.visitor is not null then
    select n.name, n.is_me into known, mine
    from public.palais_visitor_names n
    where left(new.visitor, length(n.prefix)) = n.prefix
    limit 1;

    -- her own visits are hers to make quietly, unless she's testing
    if mine then
      if coalesce((select value from public.palais_private where key = 'visit_ping_me'), 'off') <> 'on' then
        return new;
      end if;
      known := 'You';
    end if;
  end if;

  select coalesce(value, 'new') into who from public.palais_private where key = 'visit_ping_who';
  -- a stranger pings the first time only; a friend pings whenever she's back
  if who = 'new' and known is null and new.visitor is not null and exists (
    select 1 from public.palais_visits v where v.visitor = new.visitor and v.id < new.id
  ) then
    return new;
  end if;

  -- the quiet gap is there to survive being linked somewhere busy, so it only
  -- holds back strangers: a friend she has named always gets through
  if known is null then
    select coalesce(value, '5')::int into quiet from public.palais_private where key = 'visit_ping_quiet';
    select value::timestamptz into last from public.palais_private where key = 'visit_ping_last';
    if quiet > 0 and last is not null and now() - last < make_interval(mins => quiet) then
      return new;
    end if;
  end if;

  place := coalesce(nullif(concat_ws(', ', new.city, new.region), ''), new.country);
  gear := coalesce(new.os, initcap(new.device), 'a browser');
  -- a tag is whatever was typed into the link (?from=discord), so it gets a capital
  came := coalesce(new.source, initcap(new.tag), nullif(new.referrer, ''));

  perform public.palais_send_ping(
    case
      when known is not null and place is not null then known || ' (' || place || ')'
      when known is not null then known
      when place is not null then 'Someone in ' || place
      else 'Someone'
    end ||
    ' just opened the Palais · ' || gear ||
    case when came is null then '' else ' · from ' || came end
  );
  return new;
exception
  when others then
    -- a visit is worth more than a notification: never fail the insert
    raise notice 'visit ping failed: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists palais_visit_ping on public.palais_visits;
create trigger palais_visit_ping
  after insert on public.palais_visits
  for each row execute function public.palais_visit_ping();

-- Only Molly may touch any of this; the trigger function isn't callable at all.
revoke all on function public.palais_set_visit_sms(text, text, text, int) from public, anon;
grant execute on function public.palais_set_visit_sms(text, text, text, int) to authenticated;
revoke all on function public.palais_set_visit_ping(text, text, text, int) from public, anon;
grant execute on function public.palais_set_visit_ping(text, text, text, int) to authenticated;
revoke all on function public.palais_visit_ping_status() from public, anon;
grant execute on function public.palais_visit_ping_status() to authenticated;
revoke all on function public.palais_visit_ping_test() from public, anon;
grant execute on function public.palais_visit_ping_test() to authenticated;
revoke all on function public.palais_send_ping(text) from public, anon, authenticated;
revoke all on function public.palais_visit_ping() from public, anon, authenticated;
