-- ============================================================================
-- WeCanHelpWay — Stage 1 MVP schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('pending', 'active', 'suspended', 'deactivated');
exception when duplicate_object then null; end $$;

-- The full lifecycle a need travels through. The user always sees where they are.
do $$ begin
  create type need_status as enum (
    'submitted',
    'under_review',
    'needs_clarification',
    'looking_for_match',
    'match_suggested',
    'connection_proposed',
    'connected',
    'conversation_active',
    'resolved',
    'rejected',
    'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type offer_status as enum (
    'submitted',
    'under_review',
    'needs_clarification',
    'active',
    'matched',
    'paused',
    'rejected',
    'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_level as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type connection_status as enum (
    'proposed',
    'partially_accepted',
    'connected',
    'declined',
    'cancelled',
    'completed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type party_response as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  full_name         text,
  phone             text,
  phone_verified    boolean not null default false,
  avatar_url        text,
  country           text,
  address           text,
  bio               text,
  languages         text[] not null default '{}',
  skills            text[] not null default '{}',
  interests         text[] not null default '{}',
  what_they_need    text,
  what_they_offer   text,
  role              app_role not null default 'user',
  account_status    account_status not null default 'active',
  onboarding_done   boolean not null default false,
  last_seen_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Needs ("I Need Help")
-- ---------------------------------------------------------------------------
create table if not exists public.needs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  category          text not null,
  -- "I'm not sure what I need" is a first-class answer, not a failure to categorise.
  not_sure          boolean not null default false,
  title             text not null,
  description       text not null,
  goal              text,
  help_type         text,
  location          text,
  availability      text,
  preferences       text,
  status            need_status not null default 'submitted',
  priority          priority_level not null default 'normal',
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists needs_user_id_idx on public.needs (user_id);
create index if not exists needs_status_idx on public.needs (status);

-- ---------------------------------------------------------------------------
-- Offers ("I Want to Help")
-- ---------------------------------------------------------------------------
create table if not exists public.offers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  category          text not null,
  title             text not null,
  description       text not null,
  skills            text[] not null default '{}',
  experience        text,
  availability      text,
  preferred_help    text,
  location          text,
  timezone          text,
  status            offer_status not null default 'submitted',
  priority          priority_level not null default 'normal',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists offers_user_id_idx on public.offers (user_id);
create index if not exists offers_status_idx on public.offers (status);

-- ---------------------------------------------------------------------------
-- Timeline events — the user-visible "what's happening" trail
-- ---------------------------------------------------------------------------
create table if not exists public.status_events (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null check (entity_type in ('need', 'offer', 'connection')),
  entity_id     uuid not null,
  owner_id      uuid references public.profiles (id) on delete cascade,
  status        text not null,
  message       text,
  actor_id      uuid references public.profiles (id) on delete set null,
  is_internal   boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists status_events_entity_idx on public.status_events (entity_type, entity_id, created_at desc);
create index if not exists status_events_owner_idx on public.status_events (owner_id);

-- ---------------------------------------------------------------------------
-- Admin notes (internal only)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_notes (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null check (entity_type in ('need', 'offer', 'profile', 'connection')),
  entity_id     uuid not null,
  author_id     uuid references public.profiles (id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists admin_notes_entity_idx on public.admin_notes (entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Connections — the consent workflow, not a boolean flag
-- ---------------------------------------------------------------------------
create table if not exists public.connections (
  id                  uuid primary key default gen_random_uuid(),
  need_id             uuid references public.needs (id) on delete cascade,
  offer_id            uuid references public.offers (id) on delete set null,
  requester_id        uuid not null references public.profiles (id) on delete cascade,
  helper_id           uuid not null references public.profiles (id) on delete cascade,
  proposed_by         uuid references public.profiles (id) on delete set null,
  status              connection_status not null default 'proposed',
  requester_response  party_response not null default 'pending',
  helper_response     party_response not null default 'pending',
  requester_note      text,
  helper_note         text,
  admin_message       text,
  cancel_reason       text,
  connected_at        timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint connections_distinct_parties check (requester_id <> helper_id)
);
create index if not exists connections_requester_idx on public.connections (requester_id);
create index if not exists connections_helper_idx on public.connections (helper_id);
create index if not exists connections_need_idx on public.connections (need_id);

-- ---------------------------------------------------------------------------
-- Conversations + messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  connection_id   uuid not null unique references public.connections (id) on delete cascade,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists conv_participants_user_idx on public.conversation_participants (user_id);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Notifications (in-app; email is sent alongside from the server)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so RLS policies on `profiles` don't recurse into themselves.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conv_id and cp.user_id = auth.uid()
  );
$$;

-- Two people may see each other's profile once they share a live connection.
create or replace function public.shares_connection_with(other_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.connections c
    where (c.requester_id = auth.uid() and c.helper_id = other_id)
       or (c.helper_id = auth.uid() and c.requester_id = other_id)
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists needs_touch on public.needs;
create trigger needs_touch before update on public.needs
  for each row execute function public.touch_updated_at();

drop trigger if exists offers_touch on public.offers;
create trigger offers_touch before update on public.offers
  for each row execute function public.touch_updated_at();

drop trigger if exists connections_touch on public.connections;
create trigger connections_touch before update on public.connections
  for each row execute function public.touch_updated_at();

-- Create a profile row the moment someone signs up (any provider).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, phone, phone_verified)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    new.phone,
    new.phone_confirmed_at is not null
  )
  on conflict (id) do update
    set email      = coalesce(excluded.email, public.profiles.email),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep conversations.last_message_at fresh so the inbox can sort without a join.
create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists messages_bump_conversation on public.messages;
create trigger messages_bump_conversation after insert on public.messages
  for each row execute function public.bump_conversation();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles                  enable row level security;
alter table public.needs                     enable row level security;
alter table public.offers                    enable row level security;
alter table public.status_events             enable row level security;
alter table public.admin_notes               enable row level security;
alter table public.connections               enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;
alter table public.notifications             enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin() or public.shares_connection_with(id));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- needs
drop policy if exists needs_select on public.needs;
create policy needs_select on public.needs for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    -- a proposed helper may read the need they were matched to
    or exists (select 1 from public.connections c where c.need_id = needs.id and c.helper_id = auth.uid())
  );

drop policy if exists needs_insert on public.needs;
create policy needs_insert on public.needs for insert with check (user_id = auth.uid());

drop policy if exists needs_update_own on public.needs;
create policy needs_update_own on public.needs for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists needs_update_admin on public.needs;
create policy needs_update_admin on public.needs for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists needs_delete_own on public.needs;
create policy needs_delete_own on public.needs for delete using (user_id = auth.uid() or public.is_admin());

-- offers
drop policy if exists offers_select on public.offers;
create policy offers_select on public.offers for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.connections c where c.offer_id = offers.id and c.requester_id = auth.uid())
  );

drop policy if exists offers_insert on public.offers;
create policy offers_insert on public.offers for insert with check (user_id = auth.uid());

drop policy if exists offers_update_own on public.offers;
create policy offers_update_own on public.offers for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists offers_update_admin on public.offers;
create policy offers_update_admin on public.offers for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists offers_delete_own on public.offers;
create policy offers_delete_own on public.offers for delete using (user_id = auth.uid() or public.is_admin());

-- status events: owners see the public trail, admins see everything
drop policy if exists status_events_select on public.status_events;
create policy status_events_select on public.status_events for select
  using (public.is_admin() or (owner_id = auth.uid() and is_internal = false));

drop policy if exists status_events_insert on public.status_events;
create policy status_events_insert on public.status_events for insert
  with check (public.is_admin() or actor_id = auth.uid());

-- admin notes: admins only
drop policy if exists admin_notes_all on public.admin_notes;
create policy admin_notes_all on public.admin_notes for all
  using (public.is_admin()) with check (public.is_admin());

-- connections
drop policy if exists connections_select on public.connections;
create policy connections_select on public.connections for select
  using (requester_id = auth.uid() or helper_id = auth.uid() or public.is_admin());

drop policy if exists connections_insert_admin on public.connections;
create policy connections_insert_admin on public.connections for insert
  with check (public.is_admin());

-- Parties may respond; the server action guards which columns actually change.
drop policy if exists connections_update_party on public.connections;
create policy connections_update_party on public.connections for update
  using (requester_id = auth.uid() or helper_id = auth.uid())
  with check (requester_id = auth.uid() or helper_id = auth.uid());

drop policy if exists connections_update_admin on public.connections;
create policy connections_update_admin on public.connections for update
  using (public.is_admin()) with check (public.is_admin());

-- conversations
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select
  using (public.is_conversation_participant(id) or public.is_admin());

-- participants
drop policy if exists conv_participants_select on public.conversation_participants;
create policy conv_participants_select on public.conversation_participants for select
  using (public.is_conversation_participant(conversation_id) or public.is_admin());

drop policy if exists conv_participants_update on public.conversation_participants;
create policy conv_participants_update on public.conversation_participants for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select
  using (public.is_conversation_participant(conversation_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

-- notifications
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter table public.messages replica identity full;
alter table public.notifications replica identity full;
alter table public.conversation_participants replica identity full;
alter table public.connections replica identity full;
alter table public.needs replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.conversation_participants;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.connections;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.needs;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for profile photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
