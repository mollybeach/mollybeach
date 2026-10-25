-- The Dolly Maker at Brat Academy (DollyMaker.tsx, and the palais-dolls
-- function that paints the characters).
--
-- palais_doll_draws logs every picture painted, made or edited, so the
-- function can hold each member to a few a day: each one is an image from
-- OpenAI. The finished characters are filed as made stickers on the
-- catalogue's Characters shelf (palais_stickers), like any other.
--
-- Run after 20261025120000_palais_stickers.sql. Safe to run more than once.

create table if not exists public.palais_doll_draws (
  id bigint generated always as identity primary key,
  made_by uuid not null references auth.users (id) on delete cascade,
  what text not null,
  at timestamptz not null default now()
);

create index if not exists palais_doll_draws_by_day on public.palais_doll_draws (made_by, at);

alter table public.palais_doll_draws enable row level security;
revoke all on public.palais_doll_draws from anon, authenticated;   -- the function only
