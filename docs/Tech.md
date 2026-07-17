# Tech / Architecture — SolarApp

> Architecture document
> Status: Draft v1 (MVP)
> Last updated: 2026-07-17

---

## 1. Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 16.2.10** (App Router) | Already installed |
| UI runtime | **React 19.2.4** | |
| Styling | **Tailwind CSS 4** | Eco/green theme, mobile-first |
| Maps | **Leaflet + OpenStreetMap** | Free, no API key |
| Geocoding | **OpenStreetMap Nominatim** | Free; respect usage policy |
| Solar data | **PVGIS API** (`PVcalc`) | Free, no API key, covers Kosovo |
| Backend/DB | **Supabase** (Postgres) | Phase 2 (leads, installers, auth) |
| Payments | **Stripe** | Phase 3 |
| Hosting | **Vercel** (app) + **Supabase Cloud** (DB) | |

> ⚠️ Per `AGENTS.md`: this is Next.js 16 with breaking changes vs older versions.
> Read `node_modules/next/dist/docs/` before writing framework code.

---

## 2. High-level architecture

```
┌─────────────────────────────────────────────────────────┐
│                    End user (browser)                    │
│  Input form  →  Map confirm (Leaflet)  →  Results view   │
└───────────────┬──────────────────────────┬──────────────┘
                │                          │
        (geocode address)          (calculate savings)
                │                          │
                ▼                          ▼
      OSM Nominatim API          Next.js Route Handler
      (client or server)         /api/calculate (server)
                                          │
                                   calls PVGIS PVcalc
                                          │
                                          ▼
                                     PVGIS API
```

- **Geocoding** can run client-side (Leaflet + Nominatim) or via a server route to avoid CORS/rate issues.
- **PVGIS call** runs **server-side** in a Next.js Route Handler (avoids CORS, hides logic, allows caching).
- **Calculation constants & formula** live in a single shared module so they're easy to tune.

---

## 3. Project structure (target)

```
solarpanel-saas/
├─ app/
│  ├─ layout.tsx                 # root layout (exists)
│  ├─ page.tsx                   # landing → calculator entry (exists, to build)
│  ├─ globals.css                # Tailwind + theme
│  ├─ calculator/
│  │  └─ page.tsx                # multi-step calculator UI (form → map → results)
│  └─ api/
│     ├─ geocode/route.ts        # optional server proxy to Nominatim
│     └─ calculate/route.ts      # PVGIS call + savings computation
├─ components/
│  ├─ calculator/
│  │  ├─ InputForm.tsx           # city + address + bill
│  │  ├─ MapConfirm.tsx          # Leaflet draggable pin
│  │  └─ Results.tsx             # savings, production, payback, CO₂
│  └─ ui/                        # shared UI primitives
├─ lib/
│  ├─ solar/
│  │  ├─ constants.ts            # tunable formula constants (see PRD §6.6)
│  │  ├─ formula.ts              # sizing, savings, payback, CO₂
│  │  └─ pvgis.ts                # PVGIS PVcalc client + response parsing
│  ├─ geo/
│  │  ├─ cities.ts               # Kosovo cities list for dropdown
│  │  └─ nominatim.ts            # geocoding helper
│  └─ supabase/                  # (Phase 2) client + queries
├─ docs/
│  ├─ PRD.md
│  ├─ Tech.md
│  └─ DB.md
└─ ...config files
```

---

## 4. Data flow (MVP)

1. **Input** — user fills `city`, `address`, `monthlyBill` in `InputForm`.
2. **Geocode** — `address + city + "Kosovo"` → Nominatim → `{ lat, lon }`.
3. **Confirm** — `MapConfirm` shows Leaflet map + draggable marker; user adjusts; final `{ lat, lon }` captured.
4. **Calculate** — POST `{ lat, lon, monthlyBill }` to `/api/calculate`:
   - size system from bill (`lib/solar/formula.ts`)
   - call PVGIS (`lib/solar/pvgis.ts`)
   - compute savings / payback / CO₂
   - return result JSON.
5. **Results** — `Results` renders the numbers + verdict.
6. **(Phase 2)** — persist the calculation as a lead in Supabase.

---

## 5. External APIs

### 5.1 PVGIS — `PVcalc`
- Base: `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc`
- Key params:
  - `lat`, `lon` — coordinates
  - `peakpower` — system size (kW)
  - `loss` — system losses (%), default 14
  - `outputformat=json`
  - (optional) `mountingplace`, `angle`, `aspect`
- Response: annual energy output `E_y` (kWh/year) under `outputs.totals.fixed`.
- No API key. Free. Server-side call recommended.

### 5.2 OpenStreetMap Nominatim (geocoding)
- Base: `https://nominatim.openstreetmap.org/search`
- Params: `q`, `format=json`, `limit=1`, `countrycodes=xk` (Kosovo).
- Must send a valid `User-Agent`/`Referer` and respect the ~1 req/sec usage policy.
- Consider a light server-side cache to stay within limits.

### 5.3 Leaflet + OSM tiles
- Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Include OSM attribution.

---

## 6. Error handling & resilience
- **Geocoding fails** → fall back to city-center coordinates; user places pin manually.
- **PVGIS fails/times out** → show retry + friendly error; do not crash the flow.
- **Invalid input** → inline form validation before any API call.
- Add timeouts on server-side fetches; log failures.

---

## 7. Performance
- Cache PVGIS responses by rounded `lat,lon` (results barely change within ~1 km).
- Lazy-load the Leaflet map component (client-only; avoid SSR of the map).
- Keep result computation server-side and fast (<2s target).

---

## 8. Security & privacy (MVP)
- No end-user auth; minimal PII collected (address + bill).
- Do not expose third-party calls that could be abused; proxy PVGIS server-side.
- When persistence is added (Phase 2), apply Supabase **Row Level Security** so each installer sees only their leads.

---

## 9. Roadmap alignment
- **Phase 1:** everything above, no DB.
- **Phase 2:** add `lib/supabase`, leads persistence, installer auth + dashboard, Stripe.
- **Phase 3:** embed widget (`<script>`), white-label subdomains, email notifications, i18n.
