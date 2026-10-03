-- The board's approval. Signing in isn't enough to see the dresser: a new
-- account waits, "under review", until Molly accepts it from the admin page.
--
-- Supabase owns auth.users and it can't take extra columns, so the decision
-- lives in its own table, one row per account, keyed to the user. No row yet
-- means not accepted. Editors (palais_editors) are always let through — they
-- are the board.
--
-- Run after 20260913120000_palais_layouts.sql (palais_is_editor) and
-- 20260928130000_palais_users.sql (palais_users, replaced below). Safe to
-- run more than once.

create table if not exists public.palais_members (
  id uuid primary key references auth.users (id) on delete cascade,
  accepted boolean not null default false,
  decided_at timestamptz,
  decided_by text
);

alter table public.palais_members enable row level security;
revoke all on public.palais_members from anon, authenticated;   -- functions only

/** does the signed-in account get in? Editors always do; everyone else only
    once accepted. Called by the account itself. */
create or replace function public.palais_i_am_accepted()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.palais_is_editor()
      or coalesce((select accepted from public.palais_members where id = auth.uid()), false);
$$;

grant execute on function public.palais_i_am_accepted() to authenticated;

/** the board's decision on an account (editors only) */
create or replace function public.palais_set_accepted(p_id uuid, p_accepted boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_is_editor() then
    raise exception 'only the board can accept accounts';
  end if;
  insert into public.palais_members (id, accepted, decided_at, decided_by)
  values (
    p_id,
    coalesce(p_accepted, false),
    now(),
    (select au.email from auth.users au where au.id = auth.uid())
  )
  on conflict (id) do update
    set accepted = excluded.accepted,
        decided_at = excluded.decided_at,
        decided_by = excluded.decided_by;
end;
$$;

grant execute on function public.palais_set_accepted(uuid, boolean) to authenticated;

/** the accounts, now with whether the board has accepted each one. Replaces the
    one from 20260928130000; editors only, same as before. */
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
          coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name') as name,
          au.raw_user_meta_data->>'avatar_url'           as avatar,
          coalesce(au.raw_app_meta_data->>'provider', 'email') as provider,
          au.created_at,
          au.last_sign_in_at,
          (au.email_confirmed_at is not null)            as confirmed,
          coalesce(m.accepted, false)                    as accepted
        from auth.users au
        left join public.palais_members m on m.id = au.id
      ) u
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.palais_users() to authenticated;
