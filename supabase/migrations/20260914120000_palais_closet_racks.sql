-- The default arrangement of the clothes in the Wardrobe Wing (src/palais,
-- closetRacks.ts): for each of the closet's rails, racks and shelves, the
-- order of the clothes on it, first = front.
--
-- One row per set of closet photographs: 'wide' (computers) and 'tall'
-- (phones). Everyone can read them, so every visitor sees the closet arranged
-- this way; only editors (see palais_editors) can change them. Needs
-- 20260913120000_palais_layouts.sql to have been run first.
--
-- Safe to run more than once.

create table if not exists public.palais_closet_racks (
  closet text primary key check (closet in ('wide', 'tall')),
  -- { "rack-left": ["ref-shai-dress", "amz-tulle-dress-blue", …], … }
  racks jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);

drop trigger if exists palais_closet_racks_touch on public.palais_closet_racks;
create trigger palais_closet_racks_touch
  before update on public.palais_closet_racks
  for each row execute function public.palais_touch();

alter table public.palais_closet_racks enable row level security;

drop policy if exists "anyone can look" on public.palais_closet_racks;
create policy "anyone can look" on public.palais_closet_racks
  for select to anon, authenticated using (true);

drop policy if exists "editors can add" on public.palais_closet_racks;
create policy "editors can add" on public.palais_closet_racks
  for insert to authenticated with check ((select public.palais_is_editor()));

drop policy if exists "editors can change" on public.palais_closet_racks;
create policy "editors can change" on public.palais_closet_racks
  for update to authenticated
  using ((select public.palais_is_editor()))
  with check ((select public.palais_is_editor()));

grant select on public.palais_closet_racks to anon, authenticated;
grant insert, update on public.palais_closet_racks to authenticated;
