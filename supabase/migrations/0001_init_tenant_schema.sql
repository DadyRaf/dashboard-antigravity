-- 0001_init_tenant_schema.sql
-- White-labeled service-driven dashboard schema.
-- Run this in your Supabase SQL editor (or via `supabase db push` if using the CLI).

create extension if not exists "pgcrypto";

-- ========================================================================
-- TABLES
-- ========================================================================

-- clients: one row per tenant. Source of truth for branding + subdomain.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  favicon_url text,
  brand_primary text not null default '247 74% 59%',
  brand_primary_foreground text not null default '210 40% 98%',
  brand_accent text not null default '210 40% 96.1%',
  brand_radius text not null default '0.5rem',
  default_theme text not null default 'dark' check (default_theme in ('light', 'dark')),
  n8n_webhook_base text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- services: global catalog of all 11 services we offer. Not tenant-scoped.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  description text,
  icon text,
  default_config jsonb not null default '{}',
  is_available boolean not null default true,
  sort_order int not null default 0
);

-- client_services: which services each client has enabled, plus per-client config.
create table if not exists public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  is_enabled boolean not null default true,
  config jsonb not null default '{}',
  enabled_at timestamptz not null default now(),
  unique (client_id, service_id)
);

-- executions: universal n8n run history. Backbone of the Logs page + Activity Feed.
create table if not exists public.executions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  workflow_name text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'success', 'error', 'cancelled')),
  payload jsonb,
  result jsonb,
  error_message text,
  triggered_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms bigint
);

create index if not exists executions_client_started_idx
  on public.executions (client_id, started_at desc);

create index if not exists executions_client_service_status_idx
  on public.executions (client_id, service_id, status);

-- leads: outbound sales agent output.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  execution_id uuid references public.executions(id) on delete set null,
  name text,
  email text,
  phone text,
  company text,
  title text,
  source text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'meeting_booked', 'disqualified', 'converted')),
  score int,
  notes text,
  enriched jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_client_created_idx
  on public.leads (client_id, created_at desc);

create index if not exists leads_client_status_idx
  on public.leads (client_id, status);

-- knowledge_queries: RAG query log.
create table if not exists public.knowledge_queries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  kb_namespace text,
  query text not null,
  answer text,
  source_chunks jsonb,
  latency_ms int,
  feedback smallint check (feedback in (-1, 0, 1)),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_queries_client_created_idx
  on public.knowledge_queries (client_id, created_at desc);

-- profiles: extend with client_id (table is created by Supabase Auth template; we just add the column).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  company_name text,
  avatar_url text,
  job_title text,
  client_id uuid references public.clients(id) on delete set null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists client_id uuid references public.clients(id) on delete set null;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ========================================================================
-- HELPERS
-- ========================================================================

-- Returns the client_id for the current request.
-- Prefers a `client_id` JWT custom claim (set via Supabase Auth Hook),
-- and falls back to looking it up from profiles.
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'client_id', '')::uuid,
    (select client_id from public.profiles where id = auth.uid())
  )
$$;

grant execute on function public.current_client_id() to authenticated, anon;

-- Auto-set updated_at on row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- Auto-compute duration_ms on executions when finished_at is set.
create or replace function public.executions_set_duration()
returns trigger
language plpgsql
as $$
begin
  if new.finished_at is not null and new.started_at is not null then
    new.duration_ms = floor(extract(epoch from (new.finished_at - new.started_at)) * 1000);
  end if;
  return new;
end;
$$;

drop trigger if exists executions_set_duration_trg on public.executions;
create trigger executions_set_duration_trg
  before insert or update on public.executions
  for each row execute function public.executions_set_duration();

-- ========================================================================
-- VIEWS
-- ========================================================================

-- client_branding: anonymous-safe view exposing only branding columns.
-- Used by the dashboard to load brand colors before the user signs in.
create or replace view public.client_branding as
select
  id,
  slug,
  name,
  logo_url,
  favicon_url,
  brand_primary,
  brand_primary_foreground,
  brand_accent,
  brand_radius,
  default_theme
from public.clients
where is_active = true;

grant select on public.client_branding to anon, authenticated;

-- ========================================================================
-- ROW LEVEL SECURITY
-- ========================================================================

alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.client_services enable row level security;
alter table public.executions enable row level security;
alter table public.leads enable row level security;
alter table public.knowledge_queries enable row level security;
alter table public.profiles enable row level security;

-- clients: a user can only read their own client row.
drop policy if exists "clients_self_read" on public.clients;
create policy "clients_self_read" on public.clients
  for select to authenticated
  using (id = public.current_client_id());

drop policy if exists "clients_admin_update" on public.clients;
create policy "clients_admin_update" on public.clients
  for update to authenticated
  using (id = public.current_client_id() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- services: catalog is readable by everyone.
drop policy if exists "services_read_all" on public.services;
create policy "services_read_all" on public.services
  for select to authenticated, anon
  using (true);

-- client_services
drop policy if exists "client_services_self_read" on public.client_services;
create policy "client_services_self_read" on public.client_services
  for select to authenticated
  using (client_id = public.current_client_id());

-- executions
drop policy if exists "executions_self_read" on public.executions;
create policy "executions_self_read" on public.executions
  for select to authenticated
  using (client_id = public.current_client_id());

drop policy if exists "executions_self_insert" on public.executions;
create policy "executions_self_insert" on public.executions
  for insert to authenticated
  with check (client_id = public.current_client_id());

drop policy if exists "executions_self_update" on public.executions;
create policy "executions_self_update" on public.executions
  for update to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

-- leads
drop policy if exists "leads_self_read" on public.leads;
create policy "leads_self_read" on public.leads
  for select to authenticated
  using (client_id = public.current_client_id());

drop policy if exists "leads_self_insert" on public.leads;
create policy "leads_self_insert" on public.leads
  for insert to authenticated
  with check (client_id = public.current_client_id());

drop policy if exists "leads_self_update" on public.leads;
create policy "leads_self_update" on public.leads
  for update to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

-- knowledge_queries
drop policy if exists "knowledge_queries_self_read" on public.knowledge_queries;
create policy "knowledge_queries_self_read" on public.knowledge_queries
  for select to authenticated
  using (client_id = public.current_client_id());

drop policy if exists "knowledge_queries_self_insert" on public.knowledge_queries;
create policy "knowledge_queries_self_insert" on public.knowledge_queries
  for insert to authenticated
  with check (client_id = public.current_client_id());

-- profiles
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_self_upsert" on public.profiles;
create policy "profiles_self_upsert" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ========================================================================
-- SEED: services catalog
-- ========================================================================

insert into public.services (slug, name, category, description, icon, sort_order) values
  ('outbound-sales-agents', 'Outbound AI Sales Agents', 'Lead Generation', 'Autonomous agents find prospects on LinkedIn/Apollo, research their company, and send hyper-personalized cold outreach.', 'Send', 10),
  ('ai-appointment-setters', 'AI Appointment Setters', 'Lead Generation', 'Voice and text agents that call leads back within seconds of a form submission and book qualified meetings.', 'PhoneCall', 20),
  ('ads-optimization', 'Ads Optimization & Creative', 'Lead Generation', 'AI iterates through hundreds of ad variations to find the lowest cost per acquisition.', 'Megaphone', 30),
  ('custom-knowledge-bases', 'Custom AI Knowledge Bases', 'Operational Automation', 'A private "company brain" built from your internal documents, searchable by every employee.', 'BookOpen', 40),
  ('automated-customer-support', 'Automated Customer Support', 'Operational Automation', 'AI agents that take real actions — check shipping in Shopify, issue refunds in Stripe, escalate tickets.', 'Headphones', 50),
  ('ai-onboarding-systems', 'AI Onboarding Systems', 'Operational Automation', 'Automate document collection, contract generation, and intro task setup for new clients or hires.', 'UserPlus', 60),
  ('faceless-video-pipelines', 'Faceless Video Pipelines', 'Content & Brand', 'Long-form content auto-chopped into 20+ viral-style Reels with AI captions, b-roll, and music.', 'Video', 70),
  ('ai-personas', 'AI Personas / Digital Twins', 'Content & Brand', 'A digital version of your voice and likeness for recurring communication and training videos.', 'UserCircle', 80),
  ('ai-opportunity-audits', 'AI Opportunity Audits', 'Strategic Consulting', 'Analyze your human-to-task ratio and pinpoint where AI can cut 20-40% of labor costs.', 'Target', 90),
  ('sop-digitalization', 'SOP Digitalization', 'Strategic Consulting', 'Convert manual SOPs into agentic workflows where AI performs the steps instead of a human.', 'FileText', 100),
  ('custom-tool-selection', 'Custom Tool Selection', 'Strategic Consulting', 'Fractional CTO services — vet which AI tools to actually pay for and avoid shiny-object syndrome.', 'Wrench', 110)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

-- ========================================================================
-- OPTIONAL: seed a demo client for local development.
-- Uncomment, then enable the services you want this client to see.
-- ========================================================================

-- insert into public.clients (slug, name, brand_primary, brand_primary_foreground, brand_accent)
-- values ('demo', 'Demo Client', '247 74% 59%', '210 40% 98%', '210 40% 96.1%')
-- on conflict (slug) do nothing;
--
-- insert into public.client_services (client_id, service_id, is_enabled)
-- select c.id, s.id, true
-- from public.clients c
-- cross join public.services s
-- where c.slug = 'demo' and s.slug in ('outbound-sales-agents', 'custom-knowledge-bases')
-- on conflict (client_id, service_id) do nothing;
