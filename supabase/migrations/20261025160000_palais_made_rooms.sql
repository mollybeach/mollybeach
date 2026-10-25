-- The rooms made at Brat Academy's island maker (IslandMaker.tsx, and the
-- palais-rooms function that draws them).
--
-- A member sends a few photos and says what room they want. Claude reads
-- them into a plan (spec), the image model paints one master room on the
-- Palais's own floor and ceiling, and from that master the four seasons,
-- wide for a computer and tall for a phone, and the room's little island for
-- the map. Each picture is a WebP in the public "rooms" bucket, listed in
-- `pictures` by what it is ("master", "island", "spring-desktop",
-- "winter-mobile"…). Once all ten are there the room is "ready", and anyone
-- can walk into it at #made/<id>.
--
-- Once the room's done its island is designed: from everything the room was
-- made from, with anything more the maker says of the island and any more
-- photos for it, and the pieces of scenery picked to be on it (island_notes,
-- island_photos, island_scenery).
--
-- The photos sent in are the maker's own, so they go in the private
-- "room-photos" bucket, which only the function reads.
--
-- Anyone reads the ready rooms; a maker also reads their own unfinished ones,
-- so they can come back and finish them. Only the function writes, with the
-- service key, once it has checked the maker is an accepted member
-- (palais_i_am_accepted).
--
-- palais_room_draws logs every picture asked for, so the function can hold
-- each member to a few rooms a day: each picture is an image from OpenAI.
--
-- Run after 20261025120000_palais_stickers.sql. Safe to run more than once.
-- (If an earlier copy of this file was run, the island columns are added
-- by the alters below.)

create table if not exists public.palais_made_rooms (
  id text primary key check (id ~ '^[a-z0-9-]{3,48}$'),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 2000),
  -- the story the maker tells of it, which Claude makes the blurb on its card
  -- on the World Map (spec.blurb)
  story text not null default '' check (char_length(story) <= 2000),
  -- Claude's plan of the room: what stays, the colours, the view outside,
  -- what each season does (palais-rooms/index.ts, Spec)
  spec jsonb not null default '{}'::jsonb,
  -- the photos sent in, by their path in the private bucket
  photos text[] not null default '{}',
  -- and what the maker says of the room's island, with any more photos for it
  island_notes text not null default '' check (char_length(island_notes) <= 1200),
  island_photos text[] not null default '{}',
  -- and the pieces of scenery picked to be on it (islandScenery.ts)
  island_scenery text[] not null default '{}',
  -- what's been painted so far, each by its public address
  pictures jsonb not null default '{}'::jsonb,
  status text not null default 'planned' check (status in ('planned', 'ready')),
  made_by uuid references auth.users (id) on delete set null,
  made_by_name text,
  created_at timestamptz not null default now(),
  ready_at timestamptz
);

alter table public.palais_made_rooms add column if not exists story text not null default '';
alter table public.palais_made_rooms add column if not exists island_notes text not null default '';
alter table public.palais_made_rooms add column if not exists island_photos text[] not null default '{}';
alter table public.palais_made_rooms add column if not exists island_scenery text[] not null default '{}';

create index if not exists palais_made_rooms_by_maker on public.palais_made_rooms (made_by, created_at);

alter table public.palais_made_rooms enable row level security;
revoke all on public.palais_made_rooms from anon, authenticated;
grant select (id, name, description, story, spec, island_notes, pictures, status, made_by, made_by_name, created_at, ready_at) on public.palais_made_rooms to anon, authenticated;

drop policy if exists "anyone reads the ready rooms" on public.palais_made_rooms;
create policy "anyone reads the ready rooms"
  on public.palais_made_rooms for select
  to anon, authenticated
  using (status = 'ready' or made_by = auth.uid());

create table if not exists public.palais_room_draws (
  id bigint generated always as identity primary key,
  made_by uuid not null references auth.users (id) on delete cascade,
  room text,
  what text not null,
  at timestamptz not null default now()
);

create index if not exists palais_room_draws_by_day on public.palais_room_draws (made_by, at);

alter table public.palais_room_draws enable row level security;
revoke all on public.palais_room_draws from anon, authenticated;   -- the function only

-- the made rooms' pictures: public, so the rooms can show them by address
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rooms', 'rooms', true, 8388608, array['image/webp', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- and the photos people send in: private, read only by the function
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('room-photos', 'room-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The island maps the made rooms' islands are set out on, which the World Map
-- shows after its own two islands. Each is one empty painted island (its
-- `template`, IslandMaker.tsx's MAPS) with eight plots: `plots` says which
-- room's island is on each, by the plot's number. The newest map is the open
-- one: members put their rooms' islands on its empty plots, and dress it with
-- scenery (`decor`, islandScenery.ts) while it's filling. When its last plot
-- is taken it's full (`is_full`), and the function opens the next one on a fresh copy
-- of the template.
create table if not exists public.palais_island_maps (
  n int primary key check (n >= 1),
  template text not null default 'sunset' check (template ~ '^[a-z0-9-]{1,32}$'),
  plots jsonb not null default '{}'::jsonb,
  decor jsonb not null default '[]'::jsonb,
  is_full boolean not null default false,
  created_at timestamptz not null default now(),
  filled_at timestamptz
);

alter table public.palais_island_maps enable row level security;
revoke all on public.palais_island_maps from anon, authenticated;
grant select on public.palais_island_maps to anon, authenticated;

drop policy if exists "anyone reads the island maps" on public.palais_island_maps;
create policy "anyone reads the island maps"
  on public.palais_island_maps for select
  to anon, authenticated
  using (true);

-- the first one, open
insert into public.palais_island_maps (n) values (1) on conflict (n) do nothing;
