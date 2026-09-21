-- Visitor book, part 4: names for visitors, a profile of each one, the whole
-- visit log a page at a time, which places on the map each visitor walks into,
-- and everything the browser is willing to say about itself
-- (src/palais/VisitorsShelf.tsx, src/palais/visits.ts).
--
-- A visitor is still only a salted hash of their IP address; the address itself
-- is never stored. The visitor book shows its first six characters ("visitor
-- 068f44"); this lets an editor give that code a name, and mark which one is
-- Molly herself, so her own visits can be counted apart from everyone else's.
--
-- Run after 20260913150000_palais_visits_sources.sql. Safe to run more than once.

/* ---------------------------------------------------------------- the names */

create table if not exists public.palais_visitor_names (
  prefix text primary key check (prefix ~ '^[0-9a-f]{6}$'),  -- first six characters of palais_visits.visitor
  name text not null check (length(name) between 1 and 40),
  is_me boolean not null default false,                      -- Molly's own visits
  updated_at timestamptz not null default now()
);
alter table public.palais_visitor_names add column if not exists note text;

alter table public.palais_visitor_names enable row level security;
-- no policies on purpose: read and written only through the functions below
revoke all on public.palais_visitor_names from anon, authenticated;

insert into public.palais_visitor_names (prefix, name, is_me) values
  ('068f44', 'Molly', true),
  ('1ae5f6', 'YanYan', false),
  ('da62a5', 'Ignas', false),
  ('133283', 'Zach', false)
on conflict (prefix) do update set name = excluded.name, is_me = excluded.is_me, updated_at = now();

/* ----------------------------------------------- everything about the visit */

alter table public.palais_visits
  add column if not exists brand text,            -- Xiaomi, Samsung, Google…
  add column if not exists model text,            -- 2201117TG, SM-S918B, Pixel 8…
  add column if not exists os_version text,
  add column if not exists browser_version text,
  add column if not exists engine text,           -- Blink / WebKit / Gecko
  add column if not exists screen_w int,
  add column if not exists screen_h int,
  add column if not exists viewport_w int,
  add column if not exists viewport_h int,
  add column if not exists dpr numeric(4, 2),
  add column if not exists orientation text,
  add column if not exists language text,
  add column if not exists languages text,
  add column if not exists tz_offset int,         -- minutes ahead of UTC
  add column if not exists cores int,
  add column if not exists memory numeric(5, 1),  -- gigabytes, as the browser rounds it
  add column if not exists touch int,
  add column if not exists connection text,       -- 4g, 3g, slow-2g…
  add column if not exists downlink numeric(6, 2),
  add column if not exists save_data boolean,
  add column if not exists color_scheme text,
  add column if not exists reduced_motion boolean,
  add column if not exists installed boolean,     -- opened as an installed app
  add column if not exists landing text,
  add column if not exists referrer_path text,
  add column if not exists tag text,              -- ?from=…
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists last_seen timestamptz,
  add column if not exists seconds int default 0, -- how long they stayed
  add column if not exists pages int default 1,
  add column if not exists network text,          -- the internet provider their address belongs to
  add column if not exists asn int,               -- that provider's number
  add column if not exists zone text;             -- the time zone their own browser is set to

create index if not exists palais_visits_session on public.palais_visits (session);

drop function if exists public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text, text, text);
drop function if exists public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text, text, text, text);

create or replace function public.palais_record_visit(
  p_session text,
  p_page text default null,
  p_referrer text default null,
  p_city text default null,
  p_region text default null,
  p_country text default null,
  p_country_code text default null,
  p_lat numeric default null,
  p_lon numeric default null,
  p_timezone text default null,
  p_device text default null,
  p_os text default null,
  p_browser text default null,
  p_source text default null,
  p_brand text default null,
  p_model text default null,
  p_os_version text default null,
  p_browser_version text default null,
  p_engine text default null,
  p_screen_w int default null,
  p_screen_h int default null,
  p_viewport_w int default null,
  p_viewport_h int default null,
  p_dpr numeric default null,
  p_orientation text default null,
  p_language text default null,
  p_languages text default null,
  p_tz_offset int default null,
  p_cores int default null,
  p_memory numeric default null,
  p_touch int default null,
  p_connection text default null,
  p_downlink numeric default null,
  p_save_data boolean default null,
  p_color_scheme text default null,
  p_reduced_motion boolean default null,
  p_installed boolean default null,
  p_landing text default null,
  p_referrer_path text default null,
  p_tag text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_term text default null,
  p_utm_content text default null,
  p_network text default null,
  p_asn int default null,
  p_zone text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  headers json := nullif(current_setting('request.headers', true), '')::json;
  ip text;
  salt text;
begin
  if p_session is null or length(p_session) > 64 then
    return;
  end if;
  if exists (select 1 from public.palais_visits where session = p_session) then
    return;
  end if;

  ip := coalesce(
    headers ->> 'cf-connecting-ip',
    split_part(headers ->> 'x-forwarded-for', ',', 1),
    headers ->> 'x-real-ip'
  );
  select value into salt from public.palais_private where key = 'visit_salt';

  insert into public.palais_visits (
    visitor, session, page, referrer, city, region, country, country_code, lat, lon, timezone,
    device, os, browser, source, brand, model, os_version, browser_version, engine,
    screen_w, screen_h, viewport_w, viewport_h, dpr, orientation,
    language, languages, tz_offset, cores, memory, touch,
    connection, downlink, save_data, color_scheme, reduced_motion, installed,
    landing, referrer_path, tag, utm_medium, utm_campaign, utm_term, utm_content,
    network, asn, zone, last_seen, seconds, pages
  )
  values (
    case when nullif(trim(ip), '') is null then null
         else encode(extensions.digest(salt || trim(ip), 'sha256'), 'hex') end,
    p_session,
    left(p_page, 100),
    left(p_referrer, 200),
    left(p_city, 100),
    left(p_region, 100),
    left(p_country, 100),
    left(p_country_code, 3),
    round(p_lat, 1),
    round(p_lon, 1),
    left(p_timezone, 64),
    left(p_device, 16),
    left(p_os, 32),
    left(p_browser, 32),
    left(p_source, 40),
    left(p_brand, 40),
    left(p_model, 64),
    left(p_os_version, 32),
    left(p_browser_version, 32),
    left(p_engine, 16),
    case when p_screen_w is null then null else least(greatest(p_screen_w, 0), 30000) end,
    case when p_screen_h is null then null else least(greatest(p_screen_h, 0), 30000) end,
    case when p_viewport_w is null then null else least(greatest(p_viewport_w, 0), 30000) end,
    case when p_viewport_h is null then null else least(greatest(p_viewport_h, 0), 30000) end,
    case when p_dpr is null then null else least(greatest(p_dpr, 0), 10) end,
    left(p_orientation, 16),
    left(p_language, 16),
    left(p_languages, 100),
    case when p_tz_offset is null then null else least(greatest(p_tz_offset, -900), 900) end,
    case when p_cores is null then null else least(greatest(p_cores, 0), 512) end,
    case when p_memory is null then null else least(greatest(p_memory, 0), 1024) end,
    case when p_touch is null then null else least(greatest(p_touch, 0), 32) end,
    left(p_connection, 16),
    case when p_downlink is null then null else least(greatest(p_downlink, 0), 9999) end,
    p_save_data,
    left(p_color_scheme, 8),
    p_reduced_motion,
    p_installed,
    left(p_landing, 100),
    left(p_referrer_path, 200),
    left(p_tag, 40),
    left(p_utm_medium, 40),
    left(p_utm_campaign, 60),
    left(p_utm_term, 60),
    left(p_utm_content, 60),
    left(p_network, 80),
    case when p_asn is null then null else least(greatest(p_asn, 0), 4294967) end,
    left(p_zone, 64),
    now(),
    0,
    1
  );
end;
$$;

-- how long they stayed: sent now and then while the page is open, and as it closes
create or replace function public.palais_touch_visit(p_session text, p_seconds int default null, p_pages int default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session is null or length(p_session) > 64 then
    return;
  end if;
  update public.palais_visits
     set last_seen = now(),
         seconds = greatest(coalesce(seconds, 0), least(coalesce(p_seconds, 0), 86400)),
         pages = greatest(coalesce(pages, 1), least(coalesce(p_pages, 1), 5000))
   where session = p_session;
end;
$$;

/* ----------------------------------------------- where they went on the map */

create table if not exists public.palais_place_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session text not null,  -- the same per-tab session as palais_visits
  visitor text,           -- the same salted hash of the IP address; never the address
  place text not null,
  seconds int             -- filled in when they move on
);
alter table public.palais_place_visits add column if not exists seconds int;
create index if not exists palais_place_visits_session on public.palais_place_visits (session, created_at);
create index if not exists palais_place_visits_visitor on public.palais_place_visits (visitor);
create index if not exists palais_place_visits_created on public.palais_place_visits (created_at desc);

alter table public.palais_place_visits enable row level security;
revoke all on public.palais_place_visits from anon, authenticated;

create or replace function public.palais_record_place(p_session text, p_place text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  headers json := nullif(current_setting('request.headers', true), '')::json;
  ip text;
  salt text;
  last_id bigint;
  last_place text;
  last_at timestamptz;
begin
  if p_session is null or length(p_session) > 64 or p_place !~ '^[a-z-]{1,24}$' then
    return;
  end if;

  select id, place, created_at into last_id, last_place, last_at
    from public.palais_place_visits where session = p_session
    order by created_at desc limit 1;

  -- walking back into the place you're already in isn't a new stop
  if last_place = p_place then
    return;
  end if;
  -- a session can only take so many steps
  if (select count(*) from public.palais_place_visits where session = p_session) >= 500 then
    return;
  end if;
  -- how long they stood in the place they've just left
  if last_id is not null then
    update public.palais_place_visits
       set seconds = least(86400, greatest(0, extract(epoch from now() - last_at)::int))
     where id = last_id;
  end if;

  ip := coalesce(
    headers ->> 'cf-connecting-ip',
    split_part(headers ->> 'x-forwarded-for', ',', 1),
    headers ->> 'x-real-ip'
  );
  select value into salt from public.palais_private where key = 'visit_salt';

  insert into public.palais_place_visits (session, visitor, place)
  values (
    p_session,
    case when nullif(trim(ip), '') is null then null
         else encode(extensions.digest(salt || trim(ip), 'sha256'), 'hex') end,
    p_place
  );
end;
$$;

/* ------------------------------------------------------- a guess at a VPN */

-- how many minutes ahead of UTC a named time zone is right now (null if the
-- name isn't one Postgres knows)
create or replace function public.palais_tz_minutes(p_tz text)
returns int
language plpgsql
stable
set search_path = ''
as $$
begin
  if nullif(trim(p_tz), '') is null then
    return null;
  end if;
  return (extract(epoch from (now() at time zone p_tz) - (now() at time zone 'UTC')) / 60)::int;
exception
  when others then return null;
end;
$$;

-- why a visit looks like it came through a VPN, or null if it doesn't. Two
-- signals: the address belongs to a hosting company rather than a home or
-- mobile provider, and the visitor's own clock is set to a different time zone
-- from the one their address is in. Neither is proof, so this is only ever a
-- hint: travellers, offices and Apple's Private Relay all set it off.
create or replace function public.palais_vpn_hint(p_network text, p_asn int, p_ip_tz text, p_zone text, p_tz_offset int)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  n text := lower(coalesce(p_network, ''));
  says text[] := '{}';
  here int;
  theirs int;
begin
  if n ~ '(private relay|icloud)' or p_asn = 714 then
    return 'Apple Private Relay';
  end if;
  if n ~ '(vpn|proxy|tor exit|nordvpn|expressvpn|surfshark|mullvad|private internet|proton|windscribe|cyberghost|ipvanish|torguard|purevpn|hide\.?me|m247|datacamp|packethub|zenlayer|psychz|quadranet|choopa|vultr|digitalocean|linode|hetzner|ovh|contabo|leaseweb|worldstream|serverius|hostroyale|hosting|host europe|datacenter|data center|colocation|amazon|aws|google llc|google cloud|microsoft|azure|oracle|alibaba|tencent|cloud)' then
    says := says || 'a hosting network'::text;
  end if;
  here := public.palais_tz_minutes(p_ip_tz);
  theirs := coalesce(public.palais_tz_minutes(p_zone), p_tz_offset);
  if here is not null and theirs is not null and abs(here - theirs) > 90 then
    says := says || 'their clock is somewhere else'::text;
  end if;
  if cardinality(says) = 0 then
    return null;
  end if;
  return array_to_string(says, ' · ');
end;
$$;

/* --------------------------------------------------------- naming a visitor */

create or replace function public.palais_name_visitor(p_prefix text, p_name text, p_is_me boolean default false, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_is_editor() then
    raise exception 'only editors can name visitors';
  end if;
  if p_prefix !~ '^[0-9a-f]{6}$' then
    raise exception 'a visitor code is six characters of 0-9 and a-f';
  end if;
  if nullif(trim(p_name), '') is null then
    delete from public.palais_visitor_names where prefix = p_prefix;
    return;
  end if;
  if p_is_me then
    update public.palais_visitor_names set is_me = false where is_me and prefix <> p_prefix;
  end if;
  insert into public.palais_visitor_names (prefix, name, is_me, note)
  values (p_prefix, left(trim(p_name), 40), p_is_me, left(nullif(trim(p_note), ''), 200))
  on conflict (prefix) do update
    set name = excluded.name,
        is_me = excluded.is_me,
        note = coalesce(excluded.note, public.palais_visitor_names.note),
        updated_at = now();
end;
$$;

/* --------------------------------------------------------------- the numbers */

create or replace function public.palais_visit_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 3650)));
  mine text[] := coalesce(array(select prefix from public.palais_visitor_names where is_me), '{}');
begin
  if not public.palais_is_editor() then
    raise exception 'only editors can see visitor stats';
  end if;

  return jsonb_build_object(
    'days', p_days,
    'all_time', jsonb_build_object(
      'visits', (select count(*) from public.palais_visits),
      'unique', (select count(distinct visitor) from public.palais_visits)
    ),
    'period', jsonb_build_object(
      'visits', (select count(*) from public.palais_visits where created_at >= since),
      'unique', (select count(distinct visitor) from public.palais_visits where created_at >= since)
    ),
    'today', jsonb_build_object(
      'visits', (select count(*) from public.palais_visits where created_at >= date_trunc('day', now())),
      'unique', (select count(distinct visitor) from public.palais_visits where created_at >= date_trunc('day', now()))
    ),
    'me', jsonb_build_object(
      'name', (select name from public.palais_visitor_names where is_me limit 1),
      'visits', (select count(*) from public.palais_visits v where v.created_at >= since and left(v.visitor, 6) = any(mine))
    ),
    'time', jsonb_build_object(
      'median_seconds', (
        select coalesce(percentile_disc(0.5) within group (order by seconds), 0)::int
        from public.palais_visits
        where created_at >= since and coalesce(seconds, 0) > 0 and not (coalesce(left(visitor, 6), '') = any(mine))
      ),
      'longest_seconds', (
        select coalesce(max(seconds), 0)::int from public.palais_visits
        where created_at >= since and not (coalesce(left(visitor, 6), '') = any(mine))
      ),
      'glances', (
        select count(*) from public.palais_visits
        where created_at >= since and coalesce(seconds, 0) < 10 and not (coalesce(left(visitor, 6), '') = any(mine))
      )
    ),
    'places', coalesce((
      select jsonb_agg(jsonb_build_object('place', place, 'visits', v, 'unique', u, 'seconds', secs) order by u desc, v desc)
      from (
        select pp.place, count(*) as v, count(distinct pp.visitor) as u,
               coalesce(avg(pp.seconds) filter (where pp.seconds > 0), 0)::int as secs
        from public.palais_place_visits pp
        where pp.created_at >= since and not (coalesce(left(pp.visitor, 6), '') = any(mine))
        group by 1
      ) t
    ), '[]'::jsonb),
    'by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'visits', v, 'unique', u) order by d)
      from (
        select date_trunc('day', created_at)::date as d, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since group by 1
      ) t
    ), '[]'::jsonb),
    'by_hour', coalesce((
      select jsonb_agg(jsonb_build_object('hour', h, 'visits', v) order by h)
      from (
        select extract(hour from created_at)::int as h, count(*) as v
        from public.palais_visits where created_at >= since group by 1
      ) t
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', device, 'visits', v, 'unique', u) order by v desc)
      from (
        select coalesce(device, 'unknown') as device, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since group by 1
      ) t
    ), '[]'::jsonb),
    'makes', coalesce((
      select jsonb_agg(jsonb_build_object('brand', brand, 'model', model, 'visits', v, 'unique', u) order by v desc)
      from (
        select coalesce(brand, 'Unknown') as brand, model, count(*) as v, count(distinct visitor) as u
        from public.palais_visits
        where created_at >= since and (brand is not null or model is not null)
        group by 1, 2 order by v desc limit 15
      ) t
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('source', source, 'visits', v, 'unique', u) order by u desc, v desc)
      from (
        select coalesce(pv.source, 'Unknown') as source, count(*) as v, count(distinct pv.visitor) as u
        from public.palais_visits pv
        where pv.created_at >= since and not (coalesce(left(pv.visitor, 6), '') = any(mine))
        group by 1 order by u desc, v desc limit 15
      ) t
    ), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(jsonb_build_object('tag', tag, 'medium', medium, 'campaign', campaign, 'visits', v) order by v desc)
      from (
        select tag, utm_medium as medium, utm_campaign as campaign, count(*) as v
        from public.palais_visits
        where created_at >= since and (tag is not null or utm_medium is not null or utm_campaign is not null)
        group by 1, 2, 3 order by v desc limit 10
      ) t
    ), '[]'::jsonb),
    'systems', coalesce((
      select jsonb_agg(jsonb_build_object('os', os, 'browser', browser, 'visits', v, 'unique', u) order by v desc)
      from (
        select coalesce(os, 'Unknown') as os, coalesce(browser, 'Unknown') as browser,
               count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since group by 1, 2
        order by v desc limit 12
      ) t
    ), '[]'::jsonb),
    'screens', coalesce((
      select jsonb_agg(jsonb_build_object('size', size, 'visits', v, 'unique', u) order by v desc)
      from (
        select screen_w || '×' || screen_h as size, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since and screen_w is not null
        group by 1 order by v desc limit 12
      ) t
    ), '[]'::jsonb),
    'languages', coalesce((
      select jsonb_agg(jsonb_build_object('language', language, 'visits', v, 'unique', u) order by v desc)
      from (
        select language, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since and language is not null
        group by 1 order by v desc limit 12
      ) t
    ), '[]'::jsonb),
    'connections', coalesce((
      select jsonb_agg(jsonb_build_object('connection', connection, 'visits', v, 'downlink', dl) order by v desc)
      from (
        select connection, count(*) as v, round(avg(downlink), 1) as dl
        from public.palais_visits where created_at >= since and connection is not null
        group by 1 order by v desc limit 8
      ) t
    ), '[]'::jsonb),
    'vpn', jsonb_build_object(
      'visits', (
        select count(*) from public.palais_visits
        where created_at >= since
          and public.palais_vpn_hint(network, asn, timezone, zone, tz_offset) is not null
          and not (coalesce(left(visitor, 6), '') = any(mine))
      ),
      'networks', coalesce((
        select jsonb_agg(jsonb_build_object('network', network, 'why', why, 'visits', v) order by v desc)
        from (
          select network, public.palais_vpn_hint(network, asn, timezone, zone, tz_offset) as why, count(*) as v
          from public.palais_visits
          where created_at >= since
            and public.palais_vpn_hint(network, asn, timezone, zone, tz_offset) is not null
            and not (coalesce(left(visitor, 6), '') = any(mine))
          group by 1, 2 order by v desc limit 10
        ) t
      ), '[]'::jsonb)
    ),
    'networks', coalesce((
      select jsonb_agg(jsonb_build_object('network', network, 'visits', v, 'unique', u) order by v desc)
      from (
        select network, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since and network is not null
        group by 1 order by v desc limit 12
      ) t
    ), '[]'::jsonb),
    'tastes', jsonb_build_object(
      'dark', (select count(*) from public.palais_visits where created_at >= since and color_scheme = 'dark'),
      'light', (select count(*) from public.palais_visits where created_at >= since and color_scheme = 'light'),
      'reduced_motion', (select count(*) from public.palais_visits where created_at >= since and reduced_motion),
      'installed', (select count(*) from public.palais_visits where created_at >= since and installed),
      'save_data', (select count(*) from public.palais_visits where created_at >= since and save_data)
    ),
    'countries', coalesce((
      select jsonb_agg(jsonb_build_object('country', country, 'code', country_code, 'visits', v, 'unique', u) order by u desc, v desc)
      from (
        select coalesce(country, 'Unknown') as country, max(country_code) as country_code,
               count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since group by 1
        order by u desc, v desc limit 15
      ) t
    ), '[]'::jsonb),
    'cities', coalesce((
      select jsonb_agg(jsonb_build_object('city', city, 'region', region, 'country', country, 'code', country_code, 'lat', lat, 'lon', lon, 'visits', v, 'unique', u) order by u desc, v desc)
      from (
        select city, max(region) as region, max(country) as country, max(country_code) as country_code,
               avg(lat)::numeric(6, 1) as lat, avg(lon)::numeric(6, 1) as lon,
               count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since and city is not null
        group by city, country_code
        order by u desc, v desc limit 25
      ) t
    ), '[]'::jsonb),
    'recent', '[]'::jsonb  -- the visit log now comes a page at a time from palais_visit_log
  );
end;
$$;

/* ------------------------------------------------------------- the visit log */

create or replace function public.palais_visit_log(p_before bigint default null, p_limit int default 50, p_visitor text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.palais_is_editor() then
    raise exception 'only editors can see visitor stats';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', v.id, 'at', v.created_at, 'city', v.city, 'region', v.region, 'country', v.country,
      'code', v.country_code, 'timezone', v.timezone, 'page', v.page, 'landing', v.landing,
      'referrer', v.referrer, 'referrer_path', v.referrer_path, 'source', v.source, 'tag', v.tag,
      'campaign', v.utm_campaign, 'medium', v.utm_medium,
      'device', v.device, 'os', v.os, 'os_version', v.os_version,
      'browser', v.browser, 'browser_version', v.browser_version, 'engine', v.engine,
      'brand', v.brand, 'model', v.model,
      'screen', case when v.screen_w is null then null else v.screen_w || '×' || v.screen_h end,
      'viewport', case when v.viewport_w is null then null else v.viewport_w || '×' || v.viewport_h end,
      'dpr', v.dpr, 'orientation', v.orientation, 'language', v.language, 'languages', v.languages,
      'tz_offset', v.tz_offset, 'cores', v.cores, 'memory', v.memory, 'touch', v.touch,
      'connection', v.connection, 'downlink', v.downlink, 'save_data', v.save_data,
      'color_scheme', v.color_scheme, 'reduced_motion', v.reduced_motion, 'installed', v.installed,
      'seconds', v.seconds, 'pages', v.pages, 'last_seen', v.last_seen,
      'network', v.network, 'asn', v.asn, 'zone', v.zone,
      'vpn', public.palais_vpn_hint(v.network, v.asn, v.timezone, v.zone, v.tz_offset),
      'visitor', left(v.visitor, 6), 'name', n.name, 'is_me', coalesce(n.is_me, false),
      'places', coalesce((
        select jsonb_agg(pp.place order by pp.created_at)
        from public.palais_place_visits pp where pp.session = v.session
      ), '[]'::jsonb)
    ) order by v.id desc)
    from (
      select * from public.palais_visits pv
      where (p_before is null or pv.id < p_before)
        and (p_visitor is null or left(pv.visitor, 6) = p_visitor)
      order by pv.id desc
      limit greatest(1, least(p_limit, 200))
    ) v
    left join public.palais_visitor_names n on n.prefix = left(v.visitor, 6)
  ), '[]'::jsonb);
end;
$$;

/* ----------------------------------------------------- a profile per visitor */

create or replace function public.palais_visitor_profiles()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.palais_is_editor() then
    raise exception 'only editors can see visitor stats';
  end if;

  return coalesce((
    select jsonb_agg(p order by (p ->> 'is_me')::boolean desc, (p ->> 'named')::boolean desc, (p ->> 'visits')::int desc, p ->> 'last_at' desc)
    from (
      select jsonb_build_object(
        'visitor', g.prefix,
        'name', n.name,
        'note', n.note,
        'is_me', coalesce(n.is_me, false),
        'named', n.name is not null,
        'visits', g.visits,
        'days_active', g.days_active,
        'first_at', g.first_at,
        'last_at', g.last_at,
        'last_7', g.last_7,
        'last_30', g.last_30,
        'total_seconds', g.total_seconds,
        'longest_seconds', g.longest_seconds,
        'busiest_hour', g.busiest_hour,
        'timezone', g.timezone,
        'language', g.language,
        'network', g.network,
        'vpn_visits', g.vpn_visits,
        'sources', (
          select coalesce(jsonb_agg(jsonb_build_object('name', s, 'visits', c) order by c desc), '[]'::jsonb)
          from (
            select coalesce(source, 'Unknown') as s, count(*) as c from public.palais_visits
            where left(visitor, 6) = g.prefix group by 1 order by 2 desc limit 3
          ) x
        ),
        'places', (
          select coalesce(jsonb_agg(jsonb_build_object('name', s, 'code', cc, 'visits', c) order by c desc), '[]'::jsonb)
          from (
            select concat_ws(', ', city, region, country) as s, max(country_code) as cc, count(*) as c
            from public.palais_visits
            where left(visitor, 6) = g.prefix and (city is not null or country is not null)
            group by 1 order by 3 desc limit 3
          ) x
        ),
        'map_places', (
          select coalesce(jsonb_agg(jsonb_build_object('place', pl, 'visits', c, 'seconds', secs) order by c desc), '[]'::jsonb)
          from (
            select place as pl, count(*) as c, coalesce(avg(seconds) filter (where seconds > 0), 0)::int as secs
            from public.palais_place_visits
            where left(visitor, 6) = g.prefix group by 1 order by 2 desc
          ) x
        ),
        'devices', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'device', d, 'os', o, 'os_version', ov, 'browser', b, 'browser_version', bv,
            'brand', br, 'model', mo, 'screen', sc, 'visits', c) order by c desc), '[]'::jsonb)
          from (
            select device as d, os as o, max(os_version) as ov, browser as b, max(browser_version) as bv,
                   brand as br, model as mo,
                   max(case when screen_w is null then null else screen_w || '×' || screen_h end) as sc,
                   count(*) as c
            from public.palais_visits
            where left(visitor, 6) = g.prefix
            group by device, os, browser, brand, model
            order by count(*) desc limit 4
          ) x
        )
      ) as p
      from (
        select left(visitor, 6) as prefix,
               count(*) as visits,
               count(distinct date_trunc('day', created_at)) as days_active,
               min(created_at) as first_at,
               max(created_at) as last_at,
               count(*) filter (where created_at >= now() - interval '7 days') as last_7,
               count(*) filter (where created_at >= now() - interval '30 days') as last_30,
               coalesce(sum(seconds), 0)::int as total_seconds,
               coalesce(max(seconds), 0)::int as longest_seconds,
               mode() within group (order by extract(hour from created_at)::int) as busiest_hour,
               mode() within group (order by timezone) as timezone,
               mode() within group (order by language) as language,
               mode() within group (order by network) as network,
               count(*) filter (where public.palais_vpn_hint(network, asn, timezone, zone, tz_offset) is not null) as vpn_visits
        from public.palais_visits
        where visitor is not null
        group by 1
      ) g
      left join public.palais_visitor_names n on n.prefix = g.prefix
    ) t
  ), '[]'::jsonb);
end;
$$;

/* -------------------------------------------------------------- who may call */

revoke all on function public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text, text, text, text, text, text, text, text, text, int, int, int, int, numeric, text, text, text, int, int, numeric, int, text, numeric, boolean, text, boolean, boolean, text, text, text, text, text, text, text, text, int, text) from public;
grant execute on function public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text, text, text, text, text, text, text, text, text, int, int, int, int, numeric, text, text, text, int, int, numeric, int, text, numeric, boolean, text, boolean, boolean, text, text, text, text, text, text, text, text, int, text) to anon, authenticated;
revoke all on function public.palais_tz_minutes(text) from public, anon;
revoke all on function public.palais_vpn_hint(text, int, text, text, int) from public, anon;
grant execute on function public.palais_tz_minutes(text) to authenticated;
grant execute on function public.palais_vpn_hint(text, int, text, text, int) to authenticated;
revoke all on function public.palais_touch_visit(text, int, int) from public;
grant execute on function public.palais_touch_visit(text, int, int) to anon, authenticated;
revoke all on function public.palais_record_place(text, text) from public;
grant execute on function public.palais_record_place(text, text) to anon, authenticated;
revoke all on function public.palais_name_visitor(text, text, boolean, text) from public, anon;
grant execute on function public.palais_name_visitor(text, text, boolean, text) to authenticated;
revoke all on function public.palais_visit_stats(int) from public, anon;
grant execute on function public.palais_visit_stats(int) to authenticated;
revoke all on function public.palais_visit_log(bigint, int, text) from public, anon;
grant execute on function public.palais_visit_log(bigint, int, text) to authenticated;
revoke all on function public.palais_visitor_profiles() from public, anon;
grant execute on function public.palais_visitor_profiles() to authenticated;

-- ---------------------------------------------- how long they're still there --
--
-- palais_record_place fills in the seconds of the stop someone has just LEFT,
-- which leaves the one they're standing in reading nothing. This closes that
-- one out. The site calls it alongside palais_touch_visit — every half minute,
-- and again when the page is hidden or closed — so the last page of a visit
-- counts like all the others. Calling it more than once is harmless: it just
-- recounts from when they arrived.

create or replace function public.palais_leave_place(p_session text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_id bigint;
  last_at timestamptz;
begin
  if p_session is null or length(p_session) > 64 then
    return;
  end if;
  select id, created_at into last_id, last_at
    from public.palais_place_visits where session = p_session
    order by created_at desc limit 1;
  if last_id is null then
    return;
  end if;
  update public.palais_place_visits
     set seconds = least(86400, greatest(0, extract(epoch from now() - last_at)::int))
   where id = last_id;
end;
$$;

revoke all on function public.palais_leave_place(text) from public;
grant execute on function public.palais_leave_place(text) to anon, authenticated;
