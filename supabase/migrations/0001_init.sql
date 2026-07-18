-- SolarApp — Phase 2 schema (installers + leads)
-- Billing via PayPal (Stripe not available in Kosovo).

-- ---------------------------------------------------------------------------
-- installers: paying customers (solar-panel companies)
-- ---------------------------------------------------------------------------
create table if not exists installers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  company_name text not null,
  contact_email text not null,
  phone text,
  slug text unique not null,
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  paypal_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- leads: one completed calculation by an end user, attributed to an installer
-- ---------------------------------------------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  installer_id uuid references installers(id) on delete set null,
  full_name text,
  email text,
  phone text,
  city text not null,
  address text not null,
  lat double precision not null,
  lon double precision not null,
  monthly_bill_eur numeric(10,2) not null,
  system_size_kw numeric(10,2),
  annual_production_kwh numeric(12,2),
  annual_savings_eur numeric(12,2),
  payback_years numeric(6,2),
  co2_saved_kg numeric(12,2),
  created_at timestamptz not null default now()
);

create index if not exists leads_installer_id_idx on leads (installer_id);
create index if not exists leads_created_at_idx on leads (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table installers enable row level security;
alter table leads enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.leads to anon, authenticated;

-- installers: an installer can read/update only their own row
create policy "installers_select_own"
  on installers for select
  using (auth_user_id = auth.uid());

create policy "installers_update_own"
  on installers for update
  using (auth_user_id = auth.uid());

-- leads: an installer can read only their own leads
create policy "leads_select_own"
  on leads for select
  using (
    installer_id = (
      select id from installers where auth_user_id = auth.uid()
    )
  );

-- leads: public calculator may insert a lead (anon + authenticated roles).
create policy "leads_public_insert"
  on leads for insert
  to anon, authenticated
  with check (true);
