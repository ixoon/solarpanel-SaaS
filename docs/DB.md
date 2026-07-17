# Database Schema — SolarApp

> Database document (Supabase / Postgres)
> Status: Draft v1
> Last updated: 2026-07-17

---

## 1. Note on MVP

**Phase 1 (MVP) does not require a database.** The calculator runs fully with external
APIs (Nominatim + PVGIS) and returns results directly to the browser. No data is stored.

This schema describes **Phase 2**, when we start saving **leads** and onboarding
**installers**, and **Phase 3** additions. It is provided now so the app is built with the
data model in mind.

---

## 2. Entity overview

```
installers ──1───∞── leads
     │
     └──1───∞── (auth via Supabase auth.users)

app_config (singleton-ish tunable constants, optional)
```

- An **installer** is a paying customer (solar company).
- A **lead** is one completed calculation by an end user, attributed to an installer.
- Auth is handled by Supabase `auth.users`; `installers` links to it.

---

## 3. Tables

### 3.1 `installers`
Represents a paying customer (solar-panel company).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `auth_user_id` | `uuid` | FK → `auth.users.id`, unique, nullable | Links login to installer |
| `company_name` | `text` | not null | |
| `contact_email` | `text` | not null | |
| `phone` | `text` | nullable | |
| `slug` | `text` | unique, not null | Used for embed/white-label URL |
| `subscription_status` | `text` | not null, default `'trial'` | `trial` \| `active` \| `past_due` \| `canceled` |
| `stripe_customer_id` | `text` | nullable | Phase 2 billing |
| `created_at` | `timestamptz` | not null, default `now()` | |
| `updated_at` | `timestamptz` | not null, default `now()` | |

### 3.2 `leads`
One completed calculation by an end user, attributed to an installer.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `installer_id` | `uuid` | FK → `installers.id`, nullable | Which installer owns this lead |
| `full_name` | `text` | nullable | Optional end-user name |
| `email` | `text` | nullable | Optional contact |
| `phone` | `text` | nullable | Optional contact |
| `city` | `text` | not null | Kosovo city |
| `address` | `text` | not null | Entered address |
| `lat` | `double precision` | not null | Confirmed latitude |
| `lon` | `double precision` | not null | Confirmed longitude |
| `monthly_bill_eur` | `numeric(10,2)` | not null | Input bill |
| `system_size_kw` | `numeric(10,2)` | nullable | Computed system size |
| `annual_production_kwh` | `numeric(12,2)` | nullable | From PVGIS |
| `annual_savings_eur` | `numeric(12,2)` | nullable | Computed |
| `payback_years` | `numeric(6,2)` | nullable | Computed |
| `co2_saved_kg` | `numeric(12,2)` | nullable | Computed |
| `created_at` | `timestamptz` | not null, default `now()` | |

### 3.3 `app_config` (optional)
Tunable formula constants (alternative to hardcoding). Keep a single row.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `int` | PK, default `1`, check `id = 1` | Singleton row |
| `electricity_price_eur_per_kwh` | `numeric(6,4)` | not null, default `0.08` | |
| `annual_yield_kwh_per_kw` | `numeric(8,2)` | not null, default `1300` | |
| `system_loss_pct` | `numeric(5,2)` | not null, default `14` | |
| `install_cost_eur_per_kw` | `numeric(8,2)` | not null, default `900` | |
| `co2_factor_kg_per_kwh` | `numeric(6,4)` | not null, default `0.5` | |
| `updated_at` | `timestamptz` | not null, default `now()` | |

> For MVP these live in code (`lib/solar/constants.ts`). Move to `app_config` only if you
> want to edit them without a redeploy.

---

## 4. Row Level Security (Phase 2)

Enable RLS on all tables. Key policies:

- **`installers`**: an installer can `select`/`update` only the row where
  `auth_user_id = auth.uid()`.
- **`leads`**:
  - `insert`: allowed from the public calculator (service role or a scoped anon insert
    tied to a valid installer `slug`).
  - `select`: an installer can read only leads where
    `installer_id = (select id from installers where auth_user_id = auth.uid())`.

---

## 5. Indexes

- `leads (installer_id)` — dashboard queries by installer.
- `leads (created_at desc)` — recent-first listing.
- `installers (slug)` — unique lookup for embed/white-label.
- `installers (auth_user_id)` — unique login lookup.

---

## 6. Example SQL (Phase 2, reference)

```sql
create table installers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id),
  company_name text not null,
  contact_email text not null,
  phone text,
  slug text unique not null,
  subscription_status text not null default 'trial',
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  installer_id uuid references installers(id),
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

create index leads_installer_id_idx on leads (installer_id);
create index leads_created_at_idx on leads (created_at desc);
```

---

## 7. Migration path
- **MVP:** no DB. Constants in `lib/solar/constants.ts`.
- **Phase 2:** create `installers` + `leads`, enable RLS, wire lead insert on calculation.
- **Phase 3:** add per-installer branding columns (logo URL, theme color) for white-label.
