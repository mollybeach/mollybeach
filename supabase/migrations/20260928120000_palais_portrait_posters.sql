-- The first frame of each film in the Boudoir dresser.
--
-- A film in the drawer hangs in the same gilt frame as a picture, but where a
-- picture starts painting the moment it begins arriving, a film shows nothing
-- at all until enough of it is down to decode a frame. On a slow connection
-- that is an empty black frame for a long time, and no way to tell a film that
-- is coming from one that is broken.
--
-- So the first frame is kept here as a small still, and the frame wears it as
-- its poster while the film itself is on its way. It is written the first time
-- anybody watches that film — their browser draws the frame it already has to
-- a canvas and sends the still back — so nothing has to be generated in
-- advance and nothing has to be backfilled. The first one to arrive is the one
-- that is kept; nobody can paint over a film's face afterwards.
--
-- The stills are as private as the films, so the same word opens them, exactly
-- as it does for the pictures and the notes. They are small enough to be worth
-- keeping inline rather than in the bucket (a few kilobytes of webp), which
-- means they arrive with the drawer in one call and need no signing of their
-- own — a poster is up before the film has been asked for at all.
--
-- Run after 20260919130000_palais_letters.sql (palais_letters_open).
-- Safe to run more than once.

create table if not exists public.palais_portrait_posters (
  path text primary key,           -- the film, by its name in the bucket
  made_at timestamptz not null default now(),
  w int,
  h int,
  poster text not null             -- the still itself, as a data url
);

alter table public.palais_portrait_posters enable row level security;
revoke all on public.palais_portrait_posters from anon, authenticated;   -- functions only

/** every still at once, so the drawer can hang one the moment it opens */
create or replace function public.palais_portrait_posters(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.palais_letters_open(p_key) then
    raise exception 'that word does not open the dresser';
  end if;
  return coalesce(
    (
      select jsonb_object_agg(
               p.path,
               jsonb_build_object('poster', p.poster, 'w', p.w, 'h', p.h)
             )
        from public.palais_portrait_posters p
    ),
    '{}'::jsonb
  );
end;
$$;

/**
 * Keep the first frame of a film. Whoever watches it first gives it its face,
 * and it keeps that face: this does nothing at all if the film already has
 * one, so no later visitor can replace it — and a still is capped at a quarter
 * of a megabyte, which is far more than a small webp of a frame ever needs.
 */
create or replace function public.palais_portrait_poster_put(
  p_key text,
  p_path text,
  p_poster text,
  p_w int default null,
  p_h int default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_letters_open(p_key) then
    raise exception 'that word does not open the dresser';
  end if;
  if nullif(trim(p_path), '') is null then
    raise exception 'a still belongs to a film';
  end if;
  if p_poster is null or p_poster !~ '^data:image/' or length(p_poster) > 262144 then
    raise exception 'that is not a still of a frame';
  end if;

  insert into public.palais_portrait_posters (path, poster, w, h)
  values (p_path, p_poster, p_w, p_h)
  on conflict (path) do nothing;      -- the first face is the one it keeps
end;
$$;

grant execute on function public.palais_portrait_posters(text) to anon, authenticated;
grant execute on function public.palais_portrait_poster_put(text, text, text, int, int) to anon, authenticated;
