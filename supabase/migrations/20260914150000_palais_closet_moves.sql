-- Where the clothes in the Wardrobe Wing have been dragged to, how big
-- they've been made, and which have been taken out of the closet, on top of
-- their order on the rails (closetRacks.ts).
--
-- One map per closet photograph, beside its rails: for each piece that's been
-- moved, x and y as percentages of the photograph, its scale, and its stacking
-- order if it was brought forward. Needs 20260914120000_palais_closet_racks.sql
-- first. Safe to run more than once.

alter table public.palais_closet_racks
  add column if not exists moves jsonb not null default '{}'::jsonb;

-- the ids of the clothes taken out of the closet (unhearted in the catalogue)
alter table public.palais_closet_racks
  add column if not exists hidden jsonb not null default '[]'::jsonb;
