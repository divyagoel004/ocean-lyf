-- ============================================================================
--  Hii Mikku ♡ — policies.sql   (run AFTER schema.sql)
--  Row Level Security: only the two signed-in members can touch anything.
-- ============================================================================

alter table public.users             enable row level security;
alter table public.letters           enable row level security;
alter table public.bottle_properties enable row level security;
alter table public.drafts            enable row level security;
alter table public.allowed_emails    enable row level security;  -- no policies = invisible to the browser

-- The anonymous (not-signed-in) role gets nothing at all.
revoke all on public.users, public.letters, public.bottle_properties, public.drafts, public.allowed_emails from anon;
revoke all on public.allowed_emails from authenticated;
grant select, insert, update, delete on public.letters, public.bottle_properties, public.drafts to authenticated;
grant select, update on public.users to authenticated;
grant execute on function public.mark_letter_read(uuid) to authenticated;
revoke execute on function public.mark_letter_read(uuid) from anon;

-- ---------------------------------------------------------------------------
-- users: both members can see both profiles; you can only rename yourself.
-- ---------------------------------------------------------------------------
drop policy if exists "members read profiles" on public.users;
create policy "members read profiles" on public.users
  for select to authenticated
  using (public.is_member());

drop policy if exists "update own profile" on public.users;
create policy "update own profile" on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- letters: both read everything; only the sender writes / edits / deletes.
-- ---------------------------------------------------------------------------
drop policy if exists "members read letters" on public.letters;
create policy "members read letters" on public.letters
  for select to authenticated
  using (public.is_member());

drop policy if exists "send own letters" on public.letters;
create policy "send own letters" on public.letters
  for insert to authenticated
  -- recipient_id / reply_to_id are already validated by foreign keys.
  with check (public.is_member() and sender_id = auth.uid());

drop policy if exists "edit own letters" on public.letters;
create policy "edit own letters" on public.letters
  for update to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "delete own letters" on public.letters;
create policy "delete own letters" on public.letters
  for delete to authenticated
  using (sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- bottle_properties: both read; only the letter's sender writes.
-- ---------------------------------------------------------------------------
drop policy if exists "members read bottles" on public.bottle_properties;
create policy "members read bottles" on public.bottle_properties
  for select to authenticated
  using (public.is_member());

drop policy if exists "sender adds bottle" on public.bottle_properties;
create policy "sender adds bottle" on public.bottle_properties
  for insert to authenticated
  with check (exists (select 1 from public.letters l where l.id = letter_id and l.sender_id = auth.uid()));

drop policy if exists "sender edits bottle" on public.bottle_properties;
create policy "sender edits bottle" on public.bottle_properties
  for update to authenticated
  using (exists (select 1 from public.letters l where l.id = letter_id and l.sender_id = auth.uid()))
  with check (exists (select 1 from public.letters l where l.id = letter_id and l.sender_id = auth.uid()));

drop policy if exists "sender deletes bottle" on public.bottle_properties;
create policy "sender deletes bottle" on public.bottle_properties
  for delete to authenticated
  using (exists (select 1 from public.letters l where l.id = letter_id and l.sender_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- drafts: strictly private to their author.
-- ---------------------------------------------------------------------------
drop policy if exists "own drafts" on public.drafts;
create policy "own drafts" on public.drafts
  for all to authenticated
  using (user_id = auth.uid() and public.is_member())
  with check (user_id = auth.uid() and public.is_member());
