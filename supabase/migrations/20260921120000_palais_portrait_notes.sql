-- What people say about the portraits in the Boudoir dresser.
--
-- The pictures themselves are in a private bucket and only the word opens
-- them (20260919140000_palais_portraits.sql). What's said about them is just
-- as private, so reading the notes asks for the same word — there is no way
-- to read them without it.
--
-- Nobody types a name. A note is signed with whoever left it, taken from the
-- visit it was left during: the visitor id the rest of the book uses (the
-- first six of the hash), and, if Molly has given that visitor a name, the
-- name instead. The name is looked up when the note is READ, not when it is
-- written, so naming a visitor later signs everything they ever said.
--
-- A note belongs to a picture by its path in the bucket — the same key the
-- captions table uses — so a note follows its picture and never drifts onto
-- the one beside it.
--
-- Run after 20260919130000_palais_letters.sql (palais_letters_open),
-- 20260915120000_palais_visitor_id.sql (palais_visits, palais_visitor_names)
-- and 20260913120000_palais_layouts.sql (palais_is_editor). Safe to re-run.

create table if not exists public.palais_portrait_notes (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null,              -- which picture, by its name in the bucket
  visitor text,                    -- the first six of their hash, as elsewhere
  body text not null
);
create index if not exists palais_portrait_notes_path
  on public.palais_portrait_notes (path, created_at);

alter table public.palais_portrait_notes enable row level security;
revoke all on public.palais_portrait_notes from anon, authenticated;   -- functions only

/** whoever is on the other end of a session, as the visitor book knows them */
create or replace function public.palais_who(p_session text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select left(v.visitor, 6)
    from public.palais_visits v
   where v.session = p_session
   order by v.id desc
   limit 1
$$;

/** what's been said — about one picture, or about all of them at once so the
    dresser can show a count against each without asking again */
create or replace function public.palais_portrait_notes(
  p_key text,
  p_path text default null,
  p_session text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me text := public.palais_who(p_session);
begin
  if not public.palais_letters_open(p_key) then
    raise exception 'that word does not open the dresser';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', n.id,
      'at', n.created_at,
      'path', n.path,
      'visitor', n.visitor,
      -- the name if they have one, the visitor id if not
      'author', coalesce(names.name, 'visitor ' || n.visitor, 'someone'),
      'named', names.name is not null,
      -- theirs to take back
      'mine', me is not null and n.visitor = me,
      'body', n.body
    ) order by n.created_at)
    from public.palais_portrait_notes n
    left join public.palais_visitor_names names on names.prefix = n.visitor
    where p_path is null or n.path = p_path
  ), '[]'::jsonb);
end;
$$;

/** leave one. Nothing is signed by hand: the session says who it was. */
create or replace function public.palais_portrait_note_post(
  p_key text,
  p_path text,
  p_body text,
  p_session text default null
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
    raise exception 'that word does not open the dresser';
  end if;
  if coalesce(trim(p_path), '') = '' then
    raise exception 'which picture?';
  end if;
  if coalesce(trim(p_body), '') = '' then
    raise exception 'an empty note is not a note';
  end if;
  -- a dresser, not a comment section
  if (select count(*) from public.palais_portrait_notes
      where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'that is a great many notes in an hour; try again later';
  end if;

  insert into public.palais_portrait_notes (path, visitor, body)
  values (left(trim(p_path), 300), public.palais_who(p_session), left(trim(p_body), 1000))
  returning id into fresh;
  return fresh;
end;
$$;

/** take one back: whoever left it, from the same browser, or Molly */
create or replace function public.palais_portrait_note_drop(
  p_key text,
  p_id bigint,
  p_session text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  left_by text;
  me text := public.palais_who(p_session);
begin
  if not public.palais_letters_open(p_key) then
    raise exception 'that word does not open the dresser';
  end if;
  select visitor into left_by from public.palais_portrait_notes where id = p_id;
  if not found then
    raise exception 'there is no such note';
  end if;
  if not public.palais_is_editor() and (me is null or left_by is distinct from me) then
    raise exception 'only the one who left a note may take it back';
  end if;
  delete from public.palais_portrait_notes where id = p_id;
end;
$$;

revoke all on function public.palais_who(text) from public;
grant execute on function public.palais_who(text) to anon, authenticated;
revoke all on function public.palais_portrait_notes(text, text, text) from public;
grant execute on function public.palais_portrait_notes(text, text, text) to anon, authenticated;
revoke all on function public.palais_portrait_note_post(text, text, text, text) from public;
grant execute on function public.palais_portrait_note_post(text, text, text, text) to anon, authenticated;
revoke all on function public.palais_portrait_note_drop(text, bigint, text) from public;
grant execute on function public.palais_portrait_note_drop(text, bigint, text) to anon, authenticated;
