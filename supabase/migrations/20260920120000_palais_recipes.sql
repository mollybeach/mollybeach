-- The recipes in the kitchen's cookbook.
--
-- Anyone may read them: a cookbook on a counter is for reading. Writing one in
-- asks for the same word the letters open to (palais_letters_open), and for a
-- name to put at the top of the page — a name, not a login, the way the
-- letters work. Whoever signed a recipe can tidy it up afterwards.
--
-- Run after 20260919130000_palais_letters.sql (for palais_letters_open) and
-- 20260913120000_palais_layouts.sql (for palais_is_editor). Safe to run more
-- than once.

create table if not exists public.palais_recipes (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  author text not null,            -- whose recipe it is
  name text not null,              -- what it's called
  note text,                       -- a line under the name
  ingredients text not null,       -- one to a line
  steps text not null,             -- one to a line
  sort integer
);
create index if not exists palais_recipes_order on public.palais_recipes (sort nulls last, created_at);

alter table public.palais_recipes enable row level security;
revoke all on public.palais_recipes from anon, authenticated;   -- only through the functions

/** every recipe, in the order they sit in the book */
create or replace function public.palais_recipes()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'at', r.created_at, 'edited', r.updated_at, 'author', r.author,
      'name', r.name, 'note', r.note, 'ingredients', r.ingredients, 'steps', r.steps
    ) order by r.sort nulls last, r.created_at)
    from public.palais_recipes r
  ), '[]'::jsonb)
$$;

create or replace function public.palais_recipe_post(
  p_key text,
  p_author text,
  p_name text,
  p_ingredients text,
  p_steps text,
  p_note text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  fresh bigint;
begin
  if not public.palais_letters_open(p_key) then
    raise exception 'that word does not open the cookbook';
  end if;
  if coalesce(trim(p_author), '') = '' then
    raise exception 'a recipe wants a name at the top of it';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'what is the recipe called?';
  end if;
  if coalesce(trim(p_ingredients), '') = '' and coalesce(trim(p_steps), '') = '' then
    raise exception 'an empty recipe is not a recipe';
  end if;
  -- a cookbook, not a printing press
  if (select count(*) from public.palais_recipes where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'that is a great many recipes in an hour; try again later';
  end if;

  insert into public.palais_recipes (author, name, note, ingredients, steps)
  values (
    left(trim(p_author), 40),
    left(trim(p_name), 80),
    left(nullif(trim(p_note), ''), 120),
    left(trim(p_ingredients), 4000),
    left(trim(p_steps), 8000)
  )
  returning id into fresh;
  return fresh;
end;
$$;

/** a recipe can be tidied up by whoever signed it (by the same name), or by Molly */
create or replace function public.palais_recipe_edit(
  p_key text,
  p_id bigint,
  p_author text,
  p_name text,
  p_ingredients text,
  p_steps text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  signed text;
begin
  if not public.palais_letters_open(p_key) then
    raise exception 'that word does not open the cookbook';
  end if;
  select author into signed from public.palais_recipes where id = p_id;
  if signed is null then
    raise exception 'there is no such recipe';
  end if;
  if lower(signed) <> lower(coalesce(trim(p_author), '')) and not public.palais_is_editor() then
    raise exception 'only the one who signed a recipe may change it';
  end if;
  update public.palais_recipes
     set name = left(coalesce(nullif(trim(p_name), ''), name), 80),
         note = left(nullif(trim(p_note), ''), 120),
         ingredients = left(coalesce(nullif(trim(p_ingredients), ''), ingredients), 4000),
         steps = left(coalesce(nullif(trim(p_steps), ''), steps), 8000),
         updated_at = now()
   where id = p_id;
end;
$$;

/** Molly can take a recipe out of the book, or move it */
create or replace function public.palais_recipe_keep(p_id bigint, p_sort integer default null, p_remove boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can tidy the cookbook';
  end if;
  if p_remove then
    delete from public.palais_recipes where id = p_id;
  else
    update public.palais_recipes set sort = p_sort where id = p_id;
  end if;
end;
$$;

revoke all on function public.palais_recipes() from public;
grant execute on function public.palais_recipes() to anon, authenticated;
revoke all on function public.palais_recipe_post(text, text, text, text, text, text) from public;
grant execute on function public.palais_recipe_post(text, text, text, text, text, text) to anon, authenticated;
revoke all on function public.palais_recipe_edit(text, bigint, text, text, text, text, text) from public;
grant execute on function public.palais_recipe_edit(text, bigint, text, text, text, text, text) to anon, authenticated;
revoke all on function public.palais_recipe_keep(bigint, integer, boolean) from public, anon;
grant execute on function public.palais_recipe_keep(bigint, integer, boolean) to authenticated;
