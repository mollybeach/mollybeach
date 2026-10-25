-- The stickers made at Brat Academy's sticker maker (StickerMaker.tsx, and
-- the palais-stickers function that makes them).
--
-- Each one is a WebP in the public "stickers" bucket, and a row here that
-- puts it in the catalogue: its caption, where it stands in a room, how big
-- it really is, and who made it. Anyone can read them, so every visitor gets
-- the whole catalogue. Only the function writes, with the service key, once
-- it has checked the maker is an accepted member (palais_i_am_accepted).
--
-- palais_sticker_shelves are the shelves made alongside them: a maker can
-- put their sticker on any shelf already in the catalogue, or start a new one,
-- which every sticker after can go on too.
--
-- palais_sticker_makes logs every photo sent to be made, kept or not, so the
-- function can hold each member to a few a day: each one costs a Claude call
-- and an image from OpenAI.
--
-- Run after 20260928150000_palais_members.sql. Safe to run more than once.

create table if not exists public.palais_stickers (
  id text primary key check (id ~ '^[a-z0-9_]+_sticker(_[0-9]+)?$'),
  label text not null check (char_length(label) between 1 and 160),
  plane text not null default 'near' check (plane in ('haze', 'far', 'mid', 'near', 'fore')),
  metres real check (metres is null or (metres > 0 and metres <= 20)),
  glass boolean not null default false,
  lit boolean not null default false,
  -- the catalogue shelf it's on: one of the shelves in the code (shelves.ts)
  -- or one made here (palais_sticker_shelves)
  shelf text not null check (shelf ~ '^[a-z0-9-]{1,40}$'),
  src text not null,
  made_by uuid references auth.users (id) on delete set null,
  made_by_name text,
  created_at timestamptz not null default now()
);

alter table public.palais_stickers enable row level security;
revoke all on public.palais_stickers from anon, authenticated;
grant select on public.palais_stickers to anon, authenticated;

drop policy if exists "anyone reads the made stickers" on public.palais_stickers;
create policy "anyone reads the made stickers"
  on public.palais_stickers for select
  to anon, authenticated
  using (true);

create table if not exists public.palais_sticker_shelves (
  key text primary key check (key ~ '^made-[a-z0-9-]{1,34}$'),
  name text not null unique check (char_length(name) between 1 and 40),
  emoji text not null default '✨' check (char_length(emoji) between 1 and 8),
  made_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.palais_sticker_shelves enable row level security;
revoke all on public.palais_sticker_shelves from anon, authenticated;
grant select on public.palais_sticker_shelves to anon, authenticated;

drop policy if exists "anyone reads the made shelves" on public.palais_sticker_shelves;
create policy "anyone reads the made shelves"
  on public.palais_sticker_shelves for select
  to anon, authenticated
  using (true);

create table if not exists public.palais_sticker_makes (
  id bigint generated always as identity primary key,
  made_by uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);

create index if not exists palais_sticker_makes_by_day on public.palais_sticker_makes (made_by, at);

alter table public.palais_sticker_makes enable row level security;
revoke all on public.palais_sticker_makes from anon, authenticated;   -- the function only

-- the bucket the made stickers live in: public, so the rooms can show them by
-- their address, and only WebP, up to 2 MB each
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stickers', 'stickers', true, 2097152, array['image/webp', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
