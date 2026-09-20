-- The portraits in the Boudoir dresser.
--
-- The pictures themselves are NOT here and not in the repo: they live in a
-- private Supabase Storage bucket called "portraits", which nothing can read
-- by address. The edge function palais-portraits checks the letters word and
-- signs a link for each one, good for ten minutes
-- (supabase/functions/palais-portraits).
--
-- Make the bucket once, in the dashboard: Storage → New bucket → name
-- "portraits", Public bucket OFF. Then drag pictures into it. They show up in
-- the order they're named, titled after the filename.
--
-- Films hang there too — .mp4, .webm, .mov and .m4v play in the frame. Two
-- things in the bucket's settings decide whether one can be put in:
--   * File size limit — the default is 50 MB, which is a short film. Raise it
--     on the bucket (Storage → portraits → Settings) for longer ones.
--   * Allowed MIME types — leave it empty, or it has to include video/*.
--
-- The dresser can also be added to from the room: whoever knows the word gets
-- a button under the frame, and the file goes straight from their browser to
-- the bucket on a link the function signs for that one file. It is stamped
-- with the time it arrived, so nothing is ever overwritten and the newest
-- hangs last. That needs the function deployed again:
--
--   supabase functions deploy palais-portraits
--
-- This table is only for saying it better: a row gives a picture a title, a
-- line underneath, and a place in the order. It's optional, and only Molly can
-- write it.
--
--   select palais_portrait_set('molly_and_ella.webp', 'Molly and Ella', 'the summer of the peacock', 1);
--   select palais_portrait_drop('molly_and_ella.webp');
--
-- Run after 20260919130000_palais_letters.sql (for palais_letters_open) and
-- 20260913120000_palais_layouts.sql (for palais_is_editor). Safe to run more
-- than once.

create table if not exists public.palais_portraits (
  path text primary key,                 -- the file's name in the bucket
  title text,
  note text,
  sort integer
);

alter table public.palais_portraits enable row level security;
revoke all on public.palais_portraits from anon, authenticated;
-- the edge function reads it with the service key, which RLS doesn't apply to;
-- nobody else reads it at all

create or replace function public.palais_portrait_set(
  p_path text,
  p_title text default null,
  p_note text default null,
  p_sort integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then      -- Molly, signed in or at the SQL editor
    raise exception 'only editors can name the portraits';
  end if;
  if coalesce(trim(p_path), '') = '' then
    raise exception 'which picture?';
  end if;
  insert into public.palais_portraits (path, title, note, sort)
  values (trim(p_path), nullif(trim(p_title), ''), nullif(trim(p_note), ''), p_sort)
  on conflict (path) do update
    set title = excluded.title, note = excluded.note, sort = excluded.sort;
end;
$$;

create or replace function public.palais_portrait_drop(p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can tidy the portraits';
  end if;
  delete from public.palais_portraits where path = trim(p_path);
end;
$$;

revoke all on function public.palais_portrait_set(text, text, text, integer) from public, anon;
grant execute on function public.palais_portrait_set(text, text, text, integer) to authenticated;
revoke all on function public.palais_portrait_drop(text) from public, anon;
grant execute on function public.palais_portrait_drop(text) to authenticated;
