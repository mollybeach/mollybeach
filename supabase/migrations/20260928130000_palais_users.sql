-- Who has signed in — the people behind the Boudoir dresser's Google, Apple
-- and password sign-ins, for Molly's eyes on the admin page.
--
-- The accounts live in auth.users, which the anon key cannot read. So a
-- security-definer function reads it on an editor's behalf and hands back only
-- the harmless parts: who, by what, when they joined and when they were last
-- seen — never a password, never a token. Anyone who isn't an editor gets a
-- flat refusal, the same as the rest of the book (palais_is_editor).
--
-- Run after 20260913120000_palais_layouts.sql (palais_is_editor). Safe to run
-- more than once.

create or replace function public.palais_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.palais_is_editor() then
    raise exception 'only editors can see who has signed in';
  end if;
  return coalesce(
    (
      select jsonb_agg(u order by u.created_at desc)
      from (
        select
          au.id,
          au.email,
          -- the name and picture a provider sent, if any
          coalesce(
            au.raw_user_meta_data->>'full_name',
            au.raw_user_meta_data->>'name'
          )                                              as name,
          au.raw_user_meta_data->>'avatar_url'           as avatar,
          -- 'email' for a password account, else 'google' / 'apple'
          coalesce(au.raw_app_meta_data->>'provider', 'email') as provider,
          au.created_at,
          au.last_sign_in_at,
          (au.email_confirmed_at is not null)            as confirmed
        from auth.users au
      ) u
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.palais_users() to authenticated;
