-- ============================================================================
-- BEXA AI — Initial schema
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Custom roles / enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('OWNER', 'ADMIN', 'USER');

create type public.account_status as enum ('active', 'suspended', 'invited', 'banned');

create type public.project_status as enum ('active', 'completed', 'paused', 'cancelled');

create type public.collab_role as enum ('owner', 'manager', 'developer', 'designer', 'analyst', 'contributor');

create type public.transaction_type as enum ('revenue', 'expense', 'refund', 'transfer');

create type public.transaction_status as enum ('completed', 'pending', 'failed', 'cancelled');

create type public.currency as enum ('USD', 'UZS', 'EUR', 'RUB');

-- ---------------------------------------------------------------------------
-- 2. profiles  (auth.users → 1:1 profile)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  user_id     text        not null unique,           -- stable business ID, e.g. USR-1001
  full_name   text        not null check (char_length(full_name) between 1 and 120),
  username    text        not null unique check (username ~ '^[a-zA-Z0-9_.-]{3,40}$'),
  email       text        not null unique,
  phone       text,
  role        public.user_role   not null default 'USER',
  status      public.account_status not null default 'active',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  last_login  timestamptz,
  last_activity timestamptz,
  -- password-change flow
  force_password_change boolean not null default false,
  invited_by  uuid references auth.users (id),
  -- timezone for consistent display
  timezone    text not null default 'UTC'
);

create index profiles_username_idx   on public.profiles (username);
create index profiles_email_idx      on public.profiles (email);
create index profiles_role_idx       on public.profiles (role);
create index profiles_status_idx      on public.profiles (status);
create index profiles_created_idx     on public.profiles (created_at);
create index profiles_last_activity_idx on public.profiles (last_activity);

-- ---------------------------------------------------------------------------
-- 3. projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  project_number text not null unique,   -- PRJ-1001
  name          text not null check (char_length(name) between 1 and 160),
  description   text,
  owner_id      uuid not null references auth.users (id) on delete restrict,
  status        public.project_status not null default 'active',
  start_date    timestamptz,
  deadline      timestamptz,
  budget        numeric(15,2) not null default 0,
  total_revenue numeric(15,2) not null default 0,
  total_expenses numeric(15,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index projects_owner_idx    on public.projects (owner_id);
create index projects_status_idx   on public.projects (status);
create index projects_created_idx  on public.projects (created_at);
create index projects_name_idx     on public.projects (name);

-- ---------------------------------------------------------------------------
-- 4. project_members  (collaborators / people working on a project)
-- ---------------------------------------------------------------------------
create table public.project_members (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  role           public.collab_role not null default 'contributor',
  responsibilities text,
  start_date     date not null default current_date,
  revenue_share  numeric(5,2) check (revenue_share between 0 and 100),
  created_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id)
);

create unique index pm_unique on public.project_members (project_id, user_id);
create index pm_user_idx    on public.project_members (user_id);

-- ---------------------------------------------------------------------------
-- 5. transactions  (payments / revenue / expenses / transfers)
--    Monetary values stored as precise decimal.
--    Transfers between internal accounts do NOT count as revenue.
-- ---------------------------------------------------------------------------
create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,        -- TXN-100001
  type          public.transaction_type not null,
  amount        numeric(15,2) not null check (amount >= 0),
  currency      public.currency not null default 'USD',
  date          timestamptz not null default now(),
  user_id       uuid references auth.users (id),
  project_id    uuid references public.projects (id),
  payment_method text,
  status        public.transaction_status not null default 'completed',
  description   text,
  authorized_creator uuid references auth.users (id),
  transfer_from uuid references auth.users (id),          -- internal transfer
  transfer_to   uuid references auth.users (id),
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index txn_number_idx   on public.transactions (transaction_number);
create index txn_type_idx     on public.transactions (type);
create index txn_status_idx   on public.transactions (status);
create index txn_date_idx     on public.transactions (date);
create index txn_user_idx     on public.transactions (user_id);
create index txn_project_idx  on public.transactions (project_id);
create index txn_created_idx  on public.transactions (created_at);

-- ---------------------------------------------------------------------------
-- 6. activity_log
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references auth.users (id),
  action       text not null,                 -- e.g. 'project.created'
  entity_type  text,                          -- 'project' | 'user' | 'transaction' | …
  entity_id    uuid,
  details      jsonb default '{}',
  ip_address   text,
  created_at   timestamptz not null default now()
);

create index activity_actor_idx  on public.activity_log (actor_id);
create index activity_entity_idx on public.activity_log (entity_type, entity_id);
create index activity_action_idx on public.activity_log (action);
create index activity_created_idx  on public.activity_log (created_at);

-- ---------------------------------------------------------------------------
-- 7. settings  (key/value app settings)
-- ---------------------------------------------------------------------------
create table public.settings (
  key         text primary key,
  value       text not null,
  type        text not null default 'string',
  description text,
  is_public   boolean not null default false,
  updated_by  uuid references auth.users (id),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. Helper functions
-- ---------------------------------------------------------------------------

-- trigger to update updated_at
create or replace function public.touch_updated() returns trigger
language 'plpgsql' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_updated
  before update on public.profiles
  for each row execute function public.touch_updated();

create trigger projects_updated
  before update on public.projects
  for each row execute function public.touch_updated();

create trigger transactions_updated
  before update on public.transactions
  for each row execute function public.touch_updated();

-- ---------------------------------------------------------------------------
-- 9. Row Level Security
--    OWNER (server-side role check) and ADMIN are enforced in the
--    application layer via SERVICE_ROLE.  Here we lock down the anon role.
-- ---------------------------------------------------------------------------

-- profiles: anon cannot read/write
alter table public.profiles enable row level security;
create policy "anon: no access" on public.profiles for all using (false);

-- projects: anon cannot access
alter table public.projects enable row level security;
create policy "anon: no access" on public.projects for all using (false);

-- project_members: anon cannot access
alter table public.project_members enable row level security;
create policy "anon: no access" on public.project_members for all using (false);

-- transactions: anon cannot access
alter table public.transactions enable row level security;
create policy "anon: no access" on public.transactions for all using (false);

-- activity_log: anon cannot access
alter table public.activity_log enable row level security;
create policy "anon: no access" on public.activity_log for all using (false);

-- settings: only public settings visible to anon
alter table public.settings enable row level security;
create policy "anon: read public only" on public.settings for select using (is_public = true);
create policy "anon: no write" on public.settings for all using (false);
