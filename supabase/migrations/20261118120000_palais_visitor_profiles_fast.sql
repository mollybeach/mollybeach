-- --------------------------------------------- visitor profiles, in one pass --
--
-- palais_visitor_profiles used to work out each visitor's sources, places,
-- devices and map stops with its own little query per visitor, matching on
-- left(visitor, 6). No index covers that, so every visitor meant four full
-- passes over the visit tables. Once the log grew, the whole call ran past the
-- statement timeout and the Visitors shelf and Visitor profiles page showed
-- "canceling statement due to statement timeout".
--
-- This version reads each table once, groups everything by prefix up front,
-- keeps the top few per visitor with row_number(), and joins the pieces
-- together. It returns exactly the same shape as before.

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
    with v as (
      select left(visitor, 6) as prefix, created_at, seconds, timezone, language, network,
             asn, zone, tz_offset, source, city, region, country, country_code,
             device, os, os_version, browser, browser_version, brand, model, screen_w, screen_h
      from public.palais_visits
      where visitor is not null
    ),
    g as (
      select prefix,
             count(*) as visits,
             count(distinct date_trunc('day', created_at)) as days_active,
             min(created_at) as first_at,
             max(created_at) as last_at,
             count(*) filter (where created_at >= now() - interval '7 days') as last_7,
             count(*) filter (where created_at >= now() - interval '30 days') as last_30,
             coalesce(sum(seconds), 0)::int as total_seconds,
             coalesce(max(seconds), 0)::int as longest_seconds,
             -- the hour they usually come, in THEIR local time (not UTC)
             mode() within group (order by extract(hour from created_at at time zone coalesce(nullif(timezone, ''), 'UTC'))::int) as busiest_hour,
             mode() within group (order by timezone) as timezone,
             mode() within group (order by language) as language,
             mode() within group (order by network) as network,
             count(*) filter (where public.palais_vpn_hint(network, asn, timezone, zone, tz_offset) is not null) as vpn_visits
      from v
      group by prefix
    ),
    src as (
      select prefix, jsonb_agg(jsonb_build_object('name', s, 'visits', c) order by c desc) as j
      from (
        select prefix, coalesce(source, 'Unknown') as s, count(*) as c,
               row_number() over (partition by prefix order by count(*) desc) as rn
        from v group by prefix, 2
      ) x
      where rn <= 3
      group by prefix
    ),
    plc as (
      select prefix, jsonb_agg(jsonb_build_object('name', s, 'code', cc, 'visits', c) order by c desc) as j
      from (
        select prefix, concat_ws(', ', city, region, country) as s, max(country_code) as cc, count(*) as c,
               row_number() over (partition by prefix order by count(*) desc) as rn
        from v
        where city is not null or country is not null
        group by prefix, 2
      ) x
      where rn <= 3
      group by prefix
    ),
    dev as (
      select prefix, jsonb_agg(jsonb_build_object(
               'device', d, 'os', o, 'os_version', ov, 'browser', b, 'browser_version', bv,
               'brand', br, 'model', mo, 'screen', sc, 'visits', c) order by c desc) as j
      from (
        select prefix, device as d, os as o, max(os_version) as ov, browser as b, max(browser_version) as bv,
               brand as br, model as mo,
               max(case when screen_w is null then null else screen_w || '×' || screen_h end) as sc,
               count(*) as c,
               row_number() over (partition by prefix order by count(*) desc) as rn
        from v
        group by prefix, device, os, browser, brand, model
      ) x
      where rn <= 4
      group by prefix
    ),
    mp as (
      select prefix, jsonb_agg(jsonb_build_object('place', pl, 'visits', c, 'seconds', secs) order by c desc) as j
      from (
        select left(visitor, 6) as prefix, place as pl, count(*) as c,
               coalesce(avg(seconds) filter (where seconds > 0), 0)::int as secs
        from public.palais_place_visits
        where visitor is not null
        group by 1, 2
      ) x
      group by prefix
    )
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
        'sources', coalesce(src.j, '[]'::jsonb),
        'places', coalesce(plc.j, '[]'::jsonb),
        'map_places', coalesce(mp.j, '[]'::jsonb),
        'devices', coalesce(dev.j, '[]'::jsonb)
      ) as p
      from g
      left join public.palais_visitor_names n on n.prefix = g.prefix
      left join src on src.prefix = g.prefix
      left join plc on plc.prefix = g.prefix
      left join dev on dev.prefix = g.prefix
      left join mp on mp.prefix = g.prefix
    ) t
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.palais_visitor_profiles() from public, anon;
grant execute on function public.palais_visitor_profiles() to authenticated;
