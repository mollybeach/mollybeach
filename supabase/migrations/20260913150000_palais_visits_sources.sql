-- Visitor book, part 3: where people came from — the app or site that sent
-- them (Instagram, LinkedIn, Discord, a Google search…). Run after
-- 20260913140000_palais_visits_devices.sql. Safe to run more than once.

alter table public.palais_visits add column if not exists source text;

drop function if exists public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text, text, text);

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
  p_source text default null
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

  insert into public.palais_visits
    (visitor, session, page, referrer, city, region, country, country_code, lat, lon, timezone, device, os, browser, source)
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
    left(p_source, 40)
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
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', device, 'visits', v, 'unique', u) order by v desc)
      from (
        select coalesce(device, 'unknown') as device, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since group by 1
      ) t
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('source', source, 'visits', v, 'unique', u) order by u desc, v desc)
      from (
        select coalesce(source, 'Unknown') as source, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since group by 1
        order by u desc, v desc limit 15
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
      select jsonb_agg(jsonb_build_object('at', created_at, 'city', city, 'region', region, 'country', country, 'code', country_code, 'page', page, 'referrer', referrer, 'device', device, 'os', os, 'browser', browser, 'source', source, 'visitor', left(visitor, 6)) order by created_at desc)
      from (select * from public.palais_visits order by created_at desc limit 40) t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text, text, text, text) from public;
grant execute on function public.palais_record_visit(text, text, text, text, text, text, text, numeric, numeric, text, text, text, text, text) to anon, authenticated;
revoke all on function public.palais_visit_stats(int) from public, anon;
grant execute on function public.palais_visit_stats(int) to authenticated;
