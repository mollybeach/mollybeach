-- Who's been to the Palais (src/palais/visits.ts).
--
-- One row per visit: once per browser tab session, when the home page opens.
-- The visitor's IP address is never stored. The database reads it from the
-- request, mixes it with a secret salt and keeps only the hash, which is
-- enough to count unique visitors and can't be turned back into the address.
-- Location is city-level (the browser looks it up) with coordinates rounded to
-- about 10 km.
--
-- Anyone can record a visit, but only through palais_record_visit. Only
-- editors (palais_editors) can read anything, through palais_visit_stats.
--
-- Safe to run more than once.

create table if not exists public.palais_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor text,            -- salted hash of the IP address
  session text,            -- random per browser tab session
  page text,               -- e.g. #closet
  referrer text,           -- the site they came from, host only
  city text,
  region text,
  country text,
  country_code text,
  lat numeric(6, 1),
  lon numeric(6, 1),
  timezone text,
  device text              -- phone / tablet / desktop
);

create index if not exists palais_visits_created on public.palais_visits (created_at desc);
create index if not exists palais_visits_visitor on public.palais_visits (visitor);

-- the salt: made once, never readable from the site
create table if not exists public.palais_private (
  key text primary key,
  value text not null
);
insert into public.palais_private (key, value)
values ('visit_salt', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

alter table public.palais_visits enable row level security;
alter table public.palais_private enable row level security;
-- no policies on purpose: nothing reads or writes these tables directly
revoke all on public.palais_visits from anon, authenticated;
revoke all on public.palais_private from anon, authenticated;

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
  p_device text default null
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
  -- one visit per session
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

  insert into public.palais_visits
    (visitor, session, page, referrer, city, region, country, country_code, lat, lon, timezone, device)
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
    left(p_device, 16)
  );
end;
$$;

create or replace function public.palais_visit_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 3650)));
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
    'by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'visits', v, 'unique', u) order by d)
      from (
        select date_trunc('day', created_at)::date as d, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since group by 1
      ) t
    ), '[]'::jsonb),
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
    'recent', coalesce((
      select jsonb_agg(jsonb_build_object('at', created_at, 'city', city, 'region', region, 'country', country, 'code', country_code, 'page', page, 'referrer', referrer, 'device', device, 'visitor', left(visitor, 6)) order by created_at desc)
      from (select * from public.palais_visits order by created_at desc limit 40) t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text) from public;
grant execute on function public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text) to anon, authenticated;
revoke all on function public.palais_visit_stats(int) from public, anon;
grant execute on function public.palais_visit_stats(int) to authenticated;
