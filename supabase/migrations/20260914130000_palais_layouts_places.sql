-- Layouts for every room on the map, not just the palace terrace.
--
-- Each saved look now belongs to a place (palace, closet, lakehouse, …) as
-- well as a season and a device, and each place has its own default per
-- season and device: 4 seasons × computer and phone = 8 per room. Existing
-- looks are the palace's.
--
-- Needs 20260913120000_palais_layouts.sql first. Safe to run more than once.

alter table public.palais_layouts
  add column if not exists place text not null default 'palace';

drop index if exists public.palais_layouts_one_default;
create unique index if not exists palais_layouts_one_default_per_place
  on public.palais_layouts (place, season, device)
  where is_default;

drop index if exists public.palais_layouts_season;
create index if not exists palais_layouts_place_season
  on public.palais_layouts (place, season, device, created_at desc);

-- make one layout the default for its room, season and device, unsetting the
-- old one first (two statements, so the one-default index never sees two)
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
    where place = l.place and season = l.season and device = l.device and is_default and id <> layout_id;
  update public.palais_layouts set is_default = true where id = layout_id;
end;
$$;

revoke all on function public.palais_make_default(uuid) from public, anon;
grant execute on function public.palais_make_default(uuid) to authenticated;
