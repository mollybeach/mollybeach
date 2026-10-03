-- Deny an account: the board turns someone away, and their account is removed
-- for good — deleted from auth.users, which cascades to palais_members (its id
-- references auth.users on delete cascade). They can sign in afresh later, but
-- they come back as a new face, under review again.
--
-- Editors only. Irreversible, so the admin asks before it calls this.
--
-- Run after 20260928150000_palais_members.sql. Safe to run more than once.

create or replace function public.palais_delete_account(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.palais_is_editor() then
    raise exception 'only the board can remove accounts';
  end if;
  if p_id is null then
    return;
  end if;
  -- the board can't be denied by this door (no deleting an editor's account)
  if exists (select 1 from public.palais_editors where user_id = p_id) then
    raise exception 'that account belongs to the board';
  end if;
  delete from auth.users where id = p_id;
end;
$$;

grant execute on function public.palais_delete_account(uuid) to authenticated;
