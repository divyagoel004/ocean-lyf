-- ============================================================================
--  Hii Mikku ♡ — schema.sql
--  Run this FIRST in the Supabase SQL editor, then run policies.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 0. THE TWO PEOPLE ALLOWED IN  (EDIT THESE TWO EMAILS BEFORE RUNNING!)
--    Anyone else who tries to sign in is rejected by a trigger on auth.users.
--    The table has RLS enabled with no policies, so the browser can never read it.
-- ---------------------------------------------------------------------------
create table if not exists public.allowed_emails (
  email text primary key check (email = lower(email))
);
alter table public.allowed_emails enable row level security;

insert into public.allowed_emails (email) values
  ('divyagoellcs@gmail.com'),     -- ← replace with your email (lowercase)
  ('yashdixit4123@gmail.com')    -- ← replace with Mikku's email (lowercase)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 1. users  (public profile mirror of auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email        text not null unique,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. letters
--    recipient_id NULL means "to both of us".
-- ---------------------------------------------------------------------------
create table if not exists public.letters (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default '' check (char_length(title) <= 140),
  content      text not null check (char_length(content) between 1 and 20000),
  sender_id    uuid not null references public.users (id) on delete cascade,
  recipient_id uuid references public.users (id) on delete set null,
  category     text not null default 'just_because'
               check (category in ('missing_you','i_love_you','apology','random','memory','just_because','important')),
  created_at   timestamptz not null default now(),
  is_read      boolean not null default false,
  reply_to_id  uuid references public.letters (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- 3. bottle_properties  (one row per letter; how the bottle floats)
-- ---------------------------------------------------------------------------
create table if not exists public.bottle_properties (
  id              uuid primary key default gen_random_uuid(),
  letter_id       uuid not null unique references public.letters (id) on delete cascade,
  bottle_style    smallint not null default 0 check (bottle_style between 0 and 3),
  initial_x       real not null check (initial_x between 0 and 1),
  initial_y       real not null check (initial_y between 0 and 1),
  animation_speed real not null default 1 check (animation_speed between 0.2 and 3),
  animation_phase real not null default 0 check (animation_phase between 0 and 1)
);

-- ---------------------------------------------------------------------------
-- 4. drafts  (private to each user)
-- ---------------------------------------------------------------------------
create table if not exists public.drafts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  title       text not null default '',
  content     text not null default '',
  category    text not null default 'just_because',
  reply_to_id uuid references public.letters (id) on delete set null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------
create index if not exists letters_created_at_idx   on public.letters (created_at);
create index if not exists letters_sender_idx       on public.letters (sender_id);
create index if not exists letters_recipient_idx    on public.letters (recipient_id);
create index if not exists letters_reply_to_idx     on public.letters (reply_to_id);
create index if not exists letters_unread_idx       on public.letters (recipient_id) where is_read = false;
create index if not exists drafts_user_updated_idx  on public.drafts (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- 6. Functions & triggers
-- ---------------------------------------------------------------------------

-- Create the profile row when someone signs in for the first time.
-- Rejects any email that is not on the allow-list (this blocks sign-up entirely).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if not exists (select 1 from public.allowed_emails where email = lower(new.email)) then
    raise exception 'This ocean is private.' using errcode = '42501';
  end if;

  v_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  if v_name is null then
    v_name := initcap(split_part(new.email, '@', 1));
  end if;

  insert into public.users (id, display_name, email)
  values (new.id, left(v_name, 40), lower(new.email))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- True only for the signed-in members of this private ocean.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.users u where u.id = auth.uid());
$$;

-- The *other* person marks a letter as read. Senders can never flip it themselves
-- through this function, and nobody can use it to edit letter content.
create or replace function public.mark_letter_read(p_letter_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.letters
     set is_read = true
   where id = p_letter_id
     and is_read = false
     and sender_id <> auth.uid()
     and public.is_member();
$$;

-- Keep drafts.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists drafts_touch on public.drafts;
create trigger drafts_touch
  before update on public.drafts
  for each row execute function public.touch_updated_at();

-- Never let the browser edit anything except content-ish fields of your own letters.
-- (is_read is only changed by mark_letter_read(), which is security definer.)
create or replace function public.guard_letter_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    if new.sender_id    is distinct from old.sender_id
    or new.created_at   is distinct from old.created_at
    or new.reply_to_id  is distinct from old.reply_to_id
    or new.is_read      is distinct from old.is_read then
      raise exception 'These fields cannot be changed.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists letters_guard on public.letters;
create trigger letters_guard
  before update on public.letters
  for each row execute function public.guard_letter_update();

-- ---------------------------------------------------------------------------
-- 7. Realtime (new bottles appear on both screens without refreshing)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'letters') then
    alter publication supabase_realtime add table public.letters;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bottle_properties') then
    alter publication supabase_realtime add table public.bottle_properties;
  end if;
end $$;
