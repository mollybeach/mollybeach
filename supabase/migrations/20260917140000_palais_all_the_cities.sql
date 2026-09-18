-- The visitor map was being handed the busiest 25 cities and nothing else, so
-- its caption read "25 cities" for ever after the twenty-fifth and the pins for
-- everywhere else were simply missing. It now gets up to 250, and a straight
-- count of how many there really are, which is what the caption should say.
--
-- Only palais_visit_stats changes; it is replaced whole so this file can be run
-- on its own. Run after 20260915120000_palais_visitor_id.sql. Safe to run more
-- than once.

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
    'cities_total', (select count(distinct city) from public.palais_visits where created_at >= since and city is not null),
    'cities', coalesce((
      select jsonb_agg(jsonb_build_object('city', city, 'region', region, 'country', country, 'code', country_code, 'lat', lat, 'lon', lon, 'visits', v, 'unique', u) order by u desc, v desc)
      from (
        select city, max(region) as region, max(country) as country, max(country_code) as country_code,
               avg(lat)::numeric(6, 1) as lat, avg(lon)::numeric(6, 1) as lon,
               count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since and city is not null
        group by city, country_code
        order by u desc, v desc limit 250
      ) t
    ), '[]'::jsonb),
    'recent', '[]'::jsonb  -- the visit log now comes a page at a time from palais_visit_log
  );
end;
$$;
