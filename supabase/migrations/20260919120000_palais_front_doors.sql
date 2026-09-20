-- Which door people come in by.
--
-- Every visit already records the room in the address when it began
-- (palais_visits.landing): "#lakehouse" for someone following a link straight
-- to the Lakehouse, "/" for the front door. This gives those a name, counts
-- them up in the visitor book, and says the room in Molly's phone ping.
--
-- Run after 20260917140000_palais_all_the_cities.sql. Safe to run more than once.

create or replace function public.palais_room_name(p_landing text)
returns text
language sql
immutable
as $$
  select case trim(leading '#' from coalesce(p_landing, ''))
    when '' then 'The Palais'
    when '/' then 'The Palais'
    when 'palace' then 'The Palais'
    when 'kitchen' then 'The Kitchen'
    when 'bathroom' then 'The Bathroom'
    when 'garden' then 'The Glasshouse'
    when 'closet' then 'The Wardrobe Wing'
    when 'lakehouse' then 'The Lakehouse'
    when 'lagoon' then 'The Steaming Lagoon'
    when 'rainwood' then 'The Rainwood'
    when 'gorge' then 'The Amphitheatre'
    when 'domes' then 'The City of Domes'
    when 'jacaranda' then 'The Jacaranda Quarter'
    when 'reef' then 'The Glass Reef'
    when 'lanterns' then 'The Lantern Isles'
    when 'shore' then 'The Strand'
    when 'caves' then 'The Hollow of Small Stars'
    when 'madeleine' then 'Madeleine Room'
    when 'library' then 'The Library'
    when 'boudoir' then 'The Boudoir'
    when 'sunliner' then 'Sunliner Halt'
    else null
  end
$$;
grant execute on function public.palais_room_name(text) to anon, authenticated;

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
    'landings', coalesce((
      select jsonb_agg(jsonb_build_object('landing', l, 'room', public.palais_room_name(l), 'visits', v, 'unique', u) order by v desc)
      from (
        select coalesce(nullif(landing, ''), '/') as l, count(*) as v, count(distinct visitor) as u
        from public.palais_visits where created_at >= since group by 1 order by v desc limit 20
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
  room text;
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

  -- which room they walked in through: a link straight to one (mollybeach.app/lakehouse)
  -- lands them there rather than in the palace
  room := public.palais_room_name(new.landing);

  perform public.palais_send_ping(
    case
      when known is not null and place is not null then known || ' (' || place || ')'
      when known is not null then known
      when place is not null then 'Someone in ' || place
      else 'Someone'
    end ||
    case when room is null or new.landing in ('/', '#palace') then ' just opened the Palais'
         else ' just walked into ' || room end ||
    ' · ' || gear ||
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
