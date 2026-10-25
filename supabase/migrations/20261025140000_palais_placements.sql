-- The things people have put in the rooms (placements.ts).
--
-- Molly's own arrangement of each room is its saved layout (palais_layouts),
-- which only she can change. Anyone signed in can also put things in: each
-- one is a row here, for one sticker in one room, in one season, on one kind
-- of screen (a computer's arrangement and a phone's are measured
-- differently), with where it stands, how big it is, and who put it there.
-- The rooms show Molly's layout with these laid over it.
--
-- Anyone can read them, so every visitor sees the rooms as people have left
-- them. Anyone signed in can put a thing in, move it, resize it or take it
-- out again, whoever put it there. Who put it there stays as it was: moving
-- something doesn't make it yours.
--
-- Safe to run more than once.

create table if not exists public.palais_placements (
  id bigint generated always as identity primary key,
  place text not null check (place ~ '^[a-z]{1,30}$'),
  season text not null check (season in ('spring', 'summer', 'autumn', 'winter')),
  device text not null check (device in ('desktop', 'phone')),
  prop text not null check (char_length(prop) between 1 and 120),
  x real not null default 0,
  y real not null default 0,
  s real not null default 1 check (s > 0 and s <= 8),
  z integer not null default 0,
  -- the size of the room it was measured in, so it lands in the same place
  -- in a room drawn at another size
  stage_w real not null check (stage_w > 0),
  stage_h real not null check (stage_h > 0),
  added_by uuid default auth.uid() references auth.users (id) on delete set null,
  added_by_name text check (char_length(added_by_name) <= 80),
  moved_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place, season, device, prop)
);

alter table public.palais_placements enable row level security;
revoke all on public.palais_placements from anon, authenticated;
grant select on public.palais_placements to anon, authenticated;
grant insert, update, delete on public.palais_placements to authenticated;
grant usage on sequence public.palais_placements_id_seq to authenticated;

drop policy if exists "anyone sees what's been put in" on public.palais_placements;
create policy "anyone sees what's been put in"
  on public.palais_placements for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone signed in puts things in, as themselves" on public.palais_placements;
create policy "anyone signed in puts things in, as themselves"
  on public.palais_placements for insert
  to authenticated
  with check (added_by = auth.uid());

drop policy if exists "anyone signed in moves things" on public.palais_placements;
create policy "anyone signed in moves things"
  on public.palais_placements for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "anyone signed in takes things out" on public.palais_placements;
create policy "anyone signed in takes things out"
  on public.palais_placements for delete
  to authenticated
  using (true);

-- who put it there never changes; who last moved it, and when, always does
create or replace function public.palais_placement_kept()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.added_by := old.added_by;
  new.added_by_name := old.added_by_name;
  new.created_at := old.created_at;
  new.moved_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists palais_placement_kept on public.palais_placements;
create trigger palais_placement_kept
  before update on public.palais_placements
  for each row execute function public.palais_placement_kept();
