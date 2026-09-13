-- Saved arrangements of the Palais room (src/palais).
--
-- Every layout belongs to a season. At most one per season (and device) is the
-- default: the one the room dresses itself in when that season comes round.
-- Everyone can read them; only editors (see palais_editors) can save, change
-- or delete them.
--
-- Safe to run more than once: paste it into the SQL editor, or let the GitHub
-- integration apply it on a push to master.

create table if not exists public.palais_layouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season text not null check (season in ('spring', 'summer', 'autumn', 'winter')),
  device text not null default 'desktop' check (device in ('desktop', 'phone')),
  -- the stage the layout was made on, in px: { "w": 1634, "h": 1034 }
  stage jsonb not null,
  -- per sticker: { "shown": true, "x": 0, "y": 0, "s": 1, "z": 20 }
  props jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists palais_layouts_one_default
  on public.palais_layouts (season, device)
  where is_default;

create index if not exists palais_layouts_season
  on public.palais_layouts (season, device, created_at desc);

-- who may save layouts: add yourself once, after signing up
--   insert into public.palais_editors (user_id)
--   select id from auth.users where email = 'you@example.com';
create table if not exists public.palais_editors (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.palais_is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.palais_editors where user_id = auth.uid());
$$;

create or replace function public.palais_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists palais_layouts_touch on public.palais_layouts;
create trigger palais_layouts_touch
  before update on public.palais_layouts
  for each row execute function public.palais_touch();

-- make one layout its season's default, unsetting the old one first (two
-- statements, so the one-default index never sees two at once)
create or replace function public.palais_make_default(layout_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  l public.palais_layouts;
begin
  select * into l from public.palais_layouts where id = layout_id;
  if not found then
    raise exception 'no layout %', layout_id;
  end if;
  update public.palais_layouts
    set is_default = false
    where season = l.season and device = l.device and is_default and id <> layout_id;
  update public.palais_layouts set is_default = true where id = layout_id;
end;
$$;

alter table public.palais_layouts enable row level security;
alter table public.palais_editors enable row level security;

drop policy if exists "anyone can look" on public.palais_layouts;
create policy "anyone can look" on public.palais_layouts
  for select to anon, authenticated using (true);

drop policy if exists "editors can add" on public.palais_layouts;
create policy "editors can add" on public.palais_layouts
  for insert to authenticated with check ((select public.palais_is_editor()));

drop policy if exists "editors can change" on public.palais_layouts;
create policy "editors can change" on public.palais_layouts
  for update to authenticated
  using ((select public.palais_is_editor()))
  with check ((select public.palais_is_editor()));

drop policy if exists "editors can remove" on public.palais_layouts;
create policy "editors can remove" on public.palais_layouts
  for delete to authenticated using ((select public.palais_is_editor()));

drop policy if exists "editors see themselves" on public.palais_editors;
create policy "editors see themselves" on public.palais_editors
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.palais_layouts to anon, authenticated;
grant insert, update, delete on public.palais_layouts to authenticated;
grant select on public.palais_editors to authenticated;
revoke all on function public.palais_make_default(uuid) from public, anon;
grant execute on function public.palais_make_default(uuid) to authenticated;
grant execute on function public.palais_is_editor() to anon, authenticated;
