-- What people actually do once they're inside: opening the catalogue, opening
-- the character catalogue, which character they stop on, putting the record on
-- in the Lakehouse and opening the letters (src/palais/visits.ts → noteDoing).
--
-- Same rules as the rest of the visitor book: the session is the per-tab one
-- palais_visits already knows, the visitor is still only a salted hash of the
-- address, and nothing here is readable from the site — an editor reads it
-- through palais_visit_log, and Molly's phone hears about it through the ping
-- from 20260917120000_palais_visit_ping.sql.
--
-- Run after 20260915120000_palais_visitor_id.sql. Safe to run more than once.

create table if not exists public.palais_visit_doings (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session text not null,   -- the same per-tab session as palais_visits
  visitor text,            -- the same salted hash; never the address
  kind text not null,      -- catalogue | characters | character | shelf | record | letters | pictures
                           -- | portrait | portrait-seen | portrait-film | portrait-try
  detail text              -- who they stopped on, or which shelf
);
create index if not exists palais_visit_doings_session on public.palais_visit_doings (session, created_at);
create index if not exists palais_visit_doings_visitor on public.palais_visit_doings (visitor);
create index if not exists palais_visit_doings_created on public.palais_visit_doings (created_at desc);

alter table public.palais_visit_doings enable row level security;
revoke all on public.palais_visit_doings from anon, authenticated;

-- Anyone may note what they're doing, but only through this.
create or replace function public.palais_note_doing(p_session text, p_kind text, p_detail text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  headers json := nullif(current_setting('request.headers', true), '')::json;
  ip text;
  salt text;
  last_kind text;
  last_detail text;
begin
  if p_session is null or length(p_session) > 64 or p_kind !~ '^[a-z-]{1,24}$' then
    return;
  end if;
  -- a session can only fidget so much
  if (select count(*) from public.palais_visit_doings where session = p_session) >= 300 then
    return;
  end if;

  -- doing the same thing twice in a row is one thing done
  select kind, detail into last_kind, last_detail
    from public.palais_visit_doings where session = p_session
    order by created_at desc limit 1;
  if last_kind = p_kind and last_detail is not distinct from left(p_detail, 40) then
    return;
  end if;

  ip := coalesce(
    headers ->> 'cf-connecting-ip',
    split_part(headers ->> 'x-forwarded-for', ',', 1),
    headers ->> 'x-real-ip'
  );
  select value into salt from public.palais_private where key = 'visit_salt';

  insert into public.palais_visit_doings (session, visitor, kind, detail)
  values (
    p_session,
    case when nullif(trim(ip), '') is null then null
         else encode(extensions.digest(salt || trim(ip), 'sha256'), 'hex') end,
    p_kind,
    left(p_detail, 40)
  );
end;
$$;

revoke all on function public.palais_note_doing(text, text, text) from public;
grant execute on function public.palais_note_doing(text, text, text) to anon, authenticated;

/* ------------------------------------------- the trail, in the visitor book */

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
    select jsonb_agg((jsonb_build_object(
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
      -- each stop on the walk with how long they stood in it, so the log can
      -- say "Awards (22s) → Projects (1m 3s)" rather than just where they went
      'places', coalesce((
        select jsonb_agg(jsonb_build_object('place', pp.place, 'seconds', pp.seconds) order by pp.created_at)
        from public.palais_place_visits pp where pp.session = v.session
      ), '[]'::jsonb)
    ) || jsonb_build_object(
      -- a second object, tacked on: the first one is already at the limit
      'doings', coalesce((
        select jsonb_agg(jsonb_build_object('kind', d.kind, 'detail', d.detail, 'at', d.created_at) order by d.created_at)
        from public.palais_visit_doings d where d.session = v.session
      ), '[]'::jsonb)
    )) order by v.id desc)
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


/* ----------------------------------------------- and a buzz while it happens */

-- Whether doings ping at all. They're chattier than arrivals, so they get
-- their own switch and their own (shorter, fixed) quiet gap.
create or replace function public.palais_set_doing_ping(p_on boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can set the visit ping';
  end if;
  insert into public.palais_private (key, value) values ('visit_ping_doings', case when p_on then 'on' else 'off' end)
  on conflict (key) do update set value = excluded.value;
end;
$$;
revoke all on function public.palais_set_doing_ping(boolean) from public, anon;
grant execute on function public.palais_set_doing_ping(boolean) to authenticated;

create or replace function public.palais_doing_ping()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hash text;
  known text;
  mine boolean := false;
  place text;
  last timestamptz;
  said text;
begin
  if not exists (select 1 from public.palais_private where key = 'visit_ping_url') then
    return new;
  end if;
  if coalesce((select value from public.palais_private where key = 'visit_ping_doings'), 'on') <> 'on' then
    return new;
  end if;

  -- whose visit this is. The doing carries its own hash, but if the request
  -- arrived without an address header, the arrival in palais_visits under the
  -- same session still knows who it was.
  hash := new.visitor;
  if hash is null then
    select v.visitor into hash from public.palais_visits v
     where v.session = new.session order by v.id desc limit 1;
  end if;

  if hash is not null then
    select n.name, n.is_me into known, mine from public.palais_visitor_names n
     where left(hash, length(n.prefix)) = n.prefix limit 1;
    -- same switch as arrivals: quiet unless she's testing
    if mine then
      if coalesce((select value from public.palais_private where key = 'visit_ping_me'), 'off') <> 'on' then
        return new;
      end if;
      known := 'You';
    end if;
  end if;

  -- a minute between these, whoever it is: scrolling is quick
  select value::timestamptz into last from public.palais_private where key = 'visit_doing_last';
  if last is not null and now() - last < interval '1 minute' then
    return new;
  end if;

  select coalesce(nullif(concat_ws(', ', v.city, v.region), ''), v.country) into place
    from public.palais_visits v where v.session = new.session
    order by v.id desc limit 1;

  said := case new.kind
    when 'character' then 'stopped on ' || coalesce(new.detail, 'the characters')
    when 'characters' then 'opened the character catalogue'
    when 'catalogue' then 'opened the catalogue'
    when 'shelf' then 'opened the ' || coalesce(new.detail, '') || ' shelf'
    when 'record' then 'put the record on' || coalesce(' · ' || new.detail, '')
    when 'letters' then 'opened the letters' || coalesce(' · ' || new.detail, '')
    when 'pictures' then 'looked through the pictures in the boudoir'
    when 'portrait' then 'put something in the boudoir dresser' || coalesce(' · ' || new.detail, '')
    when 'portrait-seen' then 'stayed with a portrait in the boudoir' || coalesce(' · ' || new.detail, '')
    when 'portrait-film' then 'watched a film in the boudoir' || coalesce(' · ' || new.detail, '')
    when 'portrait-try' then 'tried a word on the boudoir dresser' || coalesce(' · ' || new.detail, '')
    when 'portrait-note' then 'left a note on a portrait' || coalesce(' · ' || new.detail, '')
    else 'did something: ' || new.kind || coalesce(' · ' || new.detail, '')
  end;

  perform public.palais_send_ping(
    case
      when known is not null then known
      when place is not null then 'Someone in ' || place
      else 'Someone'
    end || ' ' || said
  );
  insert into public.palais_private (key, value) values ('visit_doing_last', now()::text)
  on conflict (key) do update set value = excluded.value;
  return new;
exception
  when others then
    raise notice 'doing ping failed: %', sqlerrm;
    return new;
end;
$$;
revoke all on function public.palais_doing_ping() from public, anon, authenticated;

drop trigger if exists palais_doing_ping on public.palais_visit_doings;
create trigger palais_doing_ping
  after insert on public.palais_visit_doings
  for each row execute function public.palais_doing_ping();
