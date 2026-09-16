-- Who's looked at the GitHub profile (supabase/functions/github-visits).
--
-- The badge in README.md is an image served by an edge function. Every time
-- someone loads the profile page, GitHub asks for that image, and the function
-- writes a row here and draws the running total.
--
-- GitHub serves README images through its own proxy (camo), so what arrives is
-- a request from GitHub's servers, not from the reader: there is no city, no
-- browser, no way to tell one reader from another. What this can honestly
-- count is views, and when they happened. Anything reaching the function
-- directly (a link somewhere else, a feed reader) does carry a browser and an
-- address; the address is never stored, only a salted hash of it, the same way
-- palais_visits does it.
--
-- Lives in the same Supabase project as the Palais, in its own table.
-- Safe to run more than once.

create table if not exists public.github_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  badge text not null default 'profile',  -- which badge: the profile, or a repo
  via text,                               -- 'github' (through the proxy) or 'direct'
  viewer text,                            -- salted hash of the address; null for proxied views
  ua text,
  referrer text
);

create index if not exists github_visits_created on public.github_visits (created_at desc);
create index if not exists github_visits_badge on public.github_visits (badge, created_at desc);

alter table public.github_visits enable row level security;
-- no policies on purpose: nothing reads or writes this table directly
revoke all on public.github_visits from anon, authenticated;

-- the salt table is the Palais's (…_palais_visits.sql); make it if it isn't there
create table if not exists public.palais_private (
  key text primary key,
  value text not null
);
insert into public.palais_private (key, value)
values ('visit_salt', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;
alter table public.palais_private enable row level security;
revoke all on public.palais_private from anon, authenticated;

-- count a view and hand back the new total
create or replace function public.github_record_view(p_badge text default 'profile', p_ua text default null, p_referrer text default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  headers json := nullif(current_setting('request.headers', true), '')::json;
  ip text;
  salt text;
  proxied boolean;
  -- not "badge": that's also a column name, and the two would be read as one
  which text := lower(coalesce(nullif(trim(p_badge), ''), 'profile'));
begin
  if which !~ '^[a-z0-9._-]{1,40}$' then
    which := 'profile';
  end if;

  proxied := coalesce(p_ua, '') ~* 'camo|github';
  ip := coalesce(
    headers ->> 'cf-connecting-ip',
    split_part(headers ->> 'x-forwarded-for', ',', 1),
    headers ->> 'x-real-ip'
  );
  select value into salt from public.palais_private where key = 'visit_salt';

  insert into public.github_visits (badge, via, viewer, ua, referrer)
  values (
    which,
    case when proxied then 'github' else 'direct' end,
    case when proxied or nullif(trim(ip), '') is null then null
         else encode(extensions.digest(salt || trim(ip), 'sha256'), 'hex') end,
    left(p_ua, 200),
    left(p_referrer, 200)
  );

  return (select count(*) from public.github_visits v where v.badge = which);
end;
$$;

-- the total so far, without counting a view (the badge's ?peek=1)
create or replace function public.github_view_count(p_badge text default 'profile')
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) from public.github_visits
   where badge = lower(coalesce(nullif(trim(p_badge), ''), 'profile'));
$$;

-- the numbers, for the visitor book in the Palais catalogue
create or replace function public.github_view_stats(p_days int default 30)
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
    raise exception 'only editors can see the GitHub stats';
  end if;

  return jsonb_build_object(
    'days', p_days,
    'all_time', (select count(*) from public.github_visits),
    'period', (select count(*) from public.github_visits where created_at >= since),
    'today', (select count(*) from public.github_visits where created_at >= date_trunc('day', now())),
    'first_at', (select min(created_at) from public.github_visits),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object('badge', badge, 'views', v, 'last_at', last_at) order by v desc)
      from (
        select badge, count(*) as v, max(created_at) as last_at
        from public.github_visits where created_at >= since group by 1
      ) t
    ), '[]'::jsonb),
    'by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'views', v) order by d)
      from (
        select date_trunc('day', created_at)::date as d, count(*) as v
        from public.github_visits where created_at >= since group by 1
      ) t
    ), '[]'::jsonb),
    'via', coalesce((
      select jsonb_agg(jsonb_build_object('via', via, 'views', v) order by v desc)
      from (
        select coalesce(via, 'unknown') as via, count(*) as v
        from public.github_visits where created_at >= since group by 1
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.github_view_count(text) from public;
grant execute on function public.github_view_count(text) to anon, authenticated;
revoke all on function public.github_record_view(text, text, text) from public;
grant execute on function public.github_record_view(text, text, text) to anon, authenticated;
revoke all on function public.github_view_stats(int) from public, anon;
grant execute on function public.github_view_stats(int) to authenticated;
