-- A buzz on Discord when something new goes into the Boudoir dresser.
--
-- This is its own channel, separate from the visit ping (20260917120000):
-- arrivals can go to ntfy and portraits to Discord, or the other way about,
-- without one switch turning off the other.
--
-- The webhook address is a secret — anyone holding it can post to that
-- channel — so it is kept in palais_private, which nothing but these
-- security-definer functions can read. It is never in the site or the repo.
--
-- Set it up once, from the SQL editor:
--
--   -- make the webhook in Discord: Server Settings → Integrations →
--   -- Webhooks → New Webhook, pick the channel, Copy Webhook URL
--   select palais_set_portrait_ping('https://discord.com/api/webhooks/…');
--
--   -- and, to have it ping people, their Discord user ids (Settings →
--   -- Advanced → Developer Mode, then right-click them → Copy User ID).
--   -- More than one, separated by commas.
--   select palais_set_portrait_ping('https://discord.com/api/webhooks/…', '123456789012345678,987654321098765432');
--
--   select palais_portrait_ping_test();          -- see it arrive
--   select palais_set_portrait_ping(null);       -- and to stop it
--
-- Needs pg_net (Database → Extensions → pg_net), the same as the visit ping.
-- Run after 20260919130000_palais_letters.sql and the visitor-id migration.
-- Safe to run more than once.

/** where the buzz goes. Molly only. */
create or replace function public.palais_set_portrait_ping(p_url text, p_who text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can set the portrait ping';
  end if;
  if p_url is null or trim(p_url) = '' then
    delete from public.palais_private where key in ('portrait_ping_url', 'portrait_ping_who');
    return 'the dresser will stop buzzing';
  end if;
  if p_url !~ '^https://(discord\.com|discordapp\.com)/api/webhooks/' then
    raise exception 'that does not look like a Discord webhook address';
  end if;
  insert into public.palais_private (key, value) values ('portrait_ping_url', trim(p_url))
  on conflict (key) do update set value = excluded.value;
  if p_who is null or trim(p_who) = '' then
    delete from public.palais_private where key = 'portrait_ping_who';
  else
    -- one id or several, however they were pasted in
    insert into public.palais_private (key, value)
    values ('portrait_ping_who', array_to_string(
      array(select m[1] from regexp_matches(p_who, '\d{5,}', 'g') m), ','))
    on conflict (key) do update set value = excluded.value;
  end if;
  return 'the dresser will buzz Discord';
end;
$$;

/** the buzz itself. Nothing but the functions below may call it: the word is
    checked before it ever gets here. */
create or replace function public.palais_portrait_ping_now(
  p_name text,
  p_kind text default 'picture'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  url text;
  who text;
  them text[];
  sent_at timestamptz;
  said text;
  where_net text;
begin
  select value into url from public.palais_private where key = 'portrait_ping_url';
  if url is null then
    return;                       -- nowhere to send it, and that's fine
  end if;
  -- never twice in the same breath, whatever the site does
  select value::timestamptz into sent_at from public.palais_private where key = 'portrait_ping_last';
  if sent_at is not null and sent_at > now() - interval '2 seconds' then
    return;
  end if;
  select value into who from public.palais_private where key = 'portrait_ping_who';
  them := case when who is null or who = '' then null else string_to_array(who, ',') end;

  said :=
    coalesce((select string_agg('<@' || t || '>', ' ') from unnest(them) t) || ' ', '')
    || case when p_kind = 'film' then '🎞️ A new film' else '🖼️ A new picture' end
    || ' is in the Boudoir dresser'
    || coalesce(' · **' || nullif(left(regexp_replace(coalesce(p_name, ''), '[`*_~|@]', '', 'g'), 80), '') || '**', '')
    || E'\nhttps://mollybeach.app/boudoir';

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
    using url,
          jsonb_build_object(
            'content', said,
            'username', 'The Palais',
            -- only the person named may be pinged, never @everyone
            'allowed_mentions', case
              when them is null then jsonb_build_object('parse', jsonb_build_array())
              else jsonb_build_object('parse', jsonb_build_array(), 'users', to_jsonb(them))
            end
          ),
          '{"Content-Type": "application/json"}'::jsonb;

  insert into public.palais_private (key, value) values ('portrait_ping_last', now()::text)
  on conflict (key) do update set value = excluded.value;
exception
  when others then
    raise notice 'portrait ping failed: %', sqlerrm;   -- never break an upload
end;
$$;

/** what the site calls the moment a file lands in the bucket: the same word
    that opens the dresser, so only someone who could have put a picture in
    can say that one went in */
create or replace function public.palais_portrait_ping(
  p_key text,
  p_name text,
  p_kind text default 'picture'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_letters_open(p_key) then
    raise exception 'that word does not open the dresser';
  end if;
  perform public.palais_portrait_ping_now(p_name, p_kind);
end;
$$;

/** see one arrive without putting a picture in */
create or replace function public.palais_portrait_ping_test()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  url text;
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can test the portrait ping';
  end if;
  select value into url from public.palais_private where key = 'portrait_ping_url';
  if url is null then
    return 'nowhere to send it — call palais_set_portrait_ping first';
  end if;
  perform public.palais_portrait_ping_now('a-test-picture.webp', 'picture');
  return 'sent (if nothing arrived, check pg_net is on and the webhook is still good)';
end;
$$;

revoke all on function public.palais_set_portrait_ping(text, text) from public, anon;
grant execute on function public.palais_set_portrait_ping(text, text) to authenticated;
revoke all on function public.palais_portrait_ping_now(text, text) from public, anon, authenticated;
revoke all on function public.palais_portrait_ping(text, text, text) from public;
grant execute on function public.palais_portrait_ping(text, text, text) to anon, authenticated;
revoke all on function public.palais_portrait_ping_test() from public, anon;
grant execute on function public.palais_portrait_ping_test() to authenticated;
