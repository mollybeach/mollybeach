-- The letters in the library: a drawer of letters anyone can read who knows the
-- word, and write to once they've signed their name.
--
-- Nobody signs in. A reader types the word, the site sends it with every
-- request, and these functions check it against a hash kept in palais_private
-- (the table with no policies, which the site can't read). The word itself is
-- never in the code, never in the repo and never in the database: only its
-- hash. Molly sets it once, from the SQL editor:
--
--   select palais_set_letters_key('the word');      -- sets or changes it
--   select palais_letters_key_set();                -- true once one is set
--
-- Writing asks for a name, which is kept with the letter. It's a name, not a
-- login: this is a salon, not a bank.
--
-- Run after 20260913130000_palais_visits.sql (for palais_private) and
-- 20260913120000_palais_layouts.sql (for palais_is_editor). Safe to run more
-- than once.

create table if not exists public.palais_letters (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  author text not null,
  title text not null,
  body text not null,
  seal text,                                   -- the little mark on the folded letter
  pinned boolean not null default false
);
create index if not exists palais_letters_when on public.palais_letters (pinned desc, created_at desc);

alter table public.palais_letters enable row level security;
revoke all on public.palais_letters from anon, authenticated;   -- only through the functions below

-- ------------------------------------------------------------- the word ----

create or replace function public.palais_set_letters_key(p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then      -- Molly, signed in or at the SQL editor
    raise exception 'only editors can set the letters key';
  end if;
  if p_key is null or length(trim(p_key)) < 8 then
    raise exception 'that word is too short to be worth much';
  end if;
  insert into public.palais_private (key, value)
  values ('letters_key', encode(extensions.digest(trim(p_key), 'sha256'), 'hex'))
  on conflict (key) do update set value = excluded.value;
end;
$$;

create or replace function public.palais_letters_key_set()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.palais_private where key = 'letters_key')
$$;

/** does this word open the drawer? */
create or replace function public.palais_letters_open(p_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  kept text;
begin
  select value into kept from public.palais_private where key = 'letters_key';
  if kept is null or p_key is null then
    return false;
  end if;
  return kept = encode(extensions.digest(trim(p_key), 'sha256'), 'hex');
end;
$$;

-- ---------------------------------------------------------- the letters ----

create or replace function public.palais_letters(p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.palais_letters_open(p_key) then
    raise exception 'that word does not open the drawer';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'at', l.created_at, 'edited', l.updated_at,
      'author', l.author, 'title', l.title, 'body', l.body, 'seal', l.seal, 'pinned', l.pinned
    ) order by l.pinned desc, l.created_at desc)
    from public.palais_letters l
  ), '[]'::jsonb);
end;
$$;

create or replace function public.palais_letter_post(
  p_key text,
  p_author text,
  p_title text,
  p_body text,
  p_seal text default null
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
    raise exception 'that word does not open the drawer';
  end if;
  if coalesce(trim(p_author), '') = '' then
    raise exception 'a letter wants a name at the bottom of it';
  end if;
  if coalesce(trim(p_body), '') = '' then
    raise exception 'an empty letter is not a letter';
  end if;
  -- a drawer, not a printing press
  if (select count(*) from public.palais_letters where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'that is a great many letters in an hour; try again later';
  end if;

  insert into public.palais_letters (author, title, body, seal)
  values (left(trim(p_author), 40), left(coalesce(nullif(trim(p_title), ''), 'Untitled'), 80), left(trim(p_body), 8000), left(p_seal, 8))
  returning id into fresh;
  return fresh;
end;
$$;

/** a letter can be tidied up afterwards by whoever signed it (by the same name) */
create or replace function public.palais_letter_edit(
  p_key text,
  p_id bigint,
  p_author text,
  p_title text,
  p_body text
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
    raise exception 'that word does not open the drawer';
  end if;
  select author into signed from public.palais_letters where id = p_id;
  if signed is null then
    raise exception 'there is no such letter';
  end if;
  if lower(signed) <> lower(coalesce(trim(p_author), '')) and not public.palais_is_editor() then
    raise exception 'only the one who signed a letter may change it';
  end if;
  update public.palais_letters
     set title = left(coalesce(nullif(trim(p_title), ''), title), 80),
         body = left(coalesce(nullif(trim(p_body), ''), body), 8000),
         updated_at = now()
   where id = p_id;
end;
$$;

/** Molly can take a letter out of the drawer, or pin one to the top */
create or replace function public.palais_letter_keep(p_id bigint, p_pinned boolean default null, p_remove boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_may_ping() then
    raise exception 'only editors can tidy the drawer';
  end if;
  if p_remove then
    delete from public.palais_letters where id = p_id;
  elsif p_pinned is not null then
    update public.palais_letters set pinned = p_pinned where id = p_id;
  end if;
end;
$$;

revoke all on function public.palais_set_letters_key(text) from public, anon;
grant execute on function public.palais_set_letters_key(text) to authenticated;
revoke all on function public.palais_letter_keep(bigint, boolean, boolean) from public, anon;
grant execute on function public.palais_letter_keep(bigint, boolean, boolean) to authenticated;
revoke all on function public.palais_letters_open(text) from public;
grant execute on function public.palais_letters_open(text) to anon, authenticated;
revoke all on function public.palais_letters_key_set() from public;
grant execute on function public.palais_letters_key_set() to anon, authenticated;
revoke all on function public.palais_letters(text) from public;
grant execute on function public.palais_letters(text) to anon, authenticated;
revoke all on function public.palais_letter_post(text, text, text, text, text) from public;
grant execute on function public.palais_letter_post(text, text, text, text, text) to anon, authenticated;
revoke all on function public.palais_letter_edit(text, bigint, text, text, text) from public;
grant execute on function public.palais_letter_edit(text, bigint, text, text, text) to anon, authenticated;
