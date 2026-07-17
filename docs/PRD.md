# PRD — SolarApp (Solar Savings Calculator SaaS)

> Product Requirements Document
> Status: Draft v1 (MVP)
> Market: Kosovo
> Last updated: 2026-07-17

---

## 1. Overview

SolarApp is a mini-SaaS that lets homeowners in Kosovo check **whether installing
solar panels is worth it** for their specific location. The user enters their city,
address, and monthly electricity bill; confirms their exact location on a map; and the
system calculates their **estimated annual savings, energy production, payback period,
and CO₂ reduction** using real solar-irradiation data from the PVGIS API.

The product is sold **B2B to solar-panel installers** who embed the calculator on their
website to generate leads. The homeowner uses it for free; the installer pays a monthly
subscription.

---

## 2. Roles (three parties)

| Role | Who | Pays? | What they do |
|------|-----|-------|--------------|
| **SaaS owner** | You | — | Builds & sells the tool, earns recurring revenue |
| **Installer** (customer) | Solar-panel company | ✅ Monthly subscription | Embeds the calculator on their site; receives leads |
| **End user** (lead) | Homeowner in Kosovo | ❌ Free | Uses the calculator to check ROI |

**Value flow:** You → sell tool → Installer → offers calculator → End user → generates lead → back to Installer.

---

## 3. Goals

- **Primary:** Give homeowners a fast, credible estimate of solar savings for their address.
- **Business:** Recurring monthly revenue from installers (SaaS subscription).
- **UX:** Minimal friction for the end user (no signup) → maximize completed calculations (leads).

### Non-goals (for MVP)
- No installer login / dashboard yet (Phase 2).
- No payments/Stripe yet (Phase 2).
- No embed widget / white-label yet (Phase 3).
- No email notifications yet (Phase 3).
- No end-user accounts (ever — by design, to reduce friction).

---

## 4. Scope by phase

### Phase 1 — MVP (current)
Standalone calculator on our own domain. No auth, no persistence required.

1. Input form: **city** (select), **address**, **monthly electricity bill (€)**.
2. **Map confirmation** (Leaflet + OpenStreetMap): geocode the address, show a draggable pin so the user confirms exact coordinates.
3. Call **PVGIS `PVcalc`** API with the coordinates → annual production (kWh).
4. Show results: **annual savings (€)**, **annual production (kWh)**, **payback period (years)**, **CO₂ saved (kg/year)**.

### Phase 2 — Monetization
- Save each calculation as a **lead** in Supabase.
- **Installer login** + dashboard listing their leads.
- **Stripe** subscription billing.
- Manual installer onboarding (we create accounts by agreement).

### Phase 3 — Scale
- **Embed widget** via `<script>` tag (preferred over iframe).
- **White-label** (installer branding + subdomain).
- **Email notifications** to installer on new lead.
- **Multi-language** (Albanian + Serbian + English).

---

## 5. Functional requirements (MVP)

### 5.1 Input form
- **City**: dropdown of Kosovo cities — Prishtina, Prizren, Peja, Gjakova, Ferizaj, Gjilan, Mitrovica, Podujeva, Vushtrri, Suhareka, Rahovec, Malisheva, Drenas, and others.
- **Address**: free-text street/house input.
- **Monthly electricity bill (€)**: numeric input (used to estimate consumption and size the system).
- Basic validation: required fields, bill must be a positive number.

### 5.2 Map confirmation
- Geocode `address + city + "Kosovo"` via OpenStreetMap **Nominatim** (free).
- Render a **Leaflet** map centered on the geocoded point.
- **Draggable marker**; final `lat`/`lon` come from the marker position (user confirms).
- Fallback: if geocoding fails, center map on the selected city and let the user place the pin manually.

### 5.3 Calculation (PVGIS)
- Call PVGIS `PVcalc` with `lat`, `lon`, `peakpower` (system size in kW), `loss` (system losses %), `outputformat=json`.
- Read annual production `E_y` (kWh/year) from the response.

### 5.4 Results screen
Display, clearly and mobile-first:
- **Annual savings** (€/year) — headline number.
- **Annual production** (kWh/year).
- **Payback period** (years).
- **CO₂ saved** (kg/year).
- A short plain-language verdict (e.g. "Solar pays off in ~X years for your home").

---

## 6. Calculation logic

### 6.1 System sizing (from bill)
```
annual_consumption_kWh = (monthly_bill_€ / ELECTRICITY_PRICE_€_per_kWh) * 12
system_size_kW = annual_consumption_kWh / ANNUAL_YIELD_kWh_per_kW
```
`ANNUAL_YIELD_kWh_per_kW` is a rough Kosovo yield used only to size the system before the
precise PVGIS call (PVGIS then returns the accurate production for that size).

### 6.2 Production (PVGIS)
```
annual_production_kWh = PVGIS.PVcalc(lat, lon, peakpower = system_size_kW, loss = SYSTEM_LOSS_%)
```

### 6.3 Savings
```
annual_savings_€ = min(annual_production_kWh, annual_consumption_kWh) * ELECTRICITY_PRICE_€_per_kWh
```
`min(...)` prevents overestimating savings beyond what the household actually consumes.

### 6.4 Payback
```
install_cost_€ = system_size_kW * INSTALL_COST_€_per_kW
payback_years  = install_cost_€ / annual_savings_€
```

### 6.5 CO₂
```
co2_saved_kg = annual_production_kWh * CO2_FACTOR_kg_per_kWh
```

### 6.6 Configurable constants (defaults — keep editable in code)
| Constant | Default | Notes |
|----------|---------|-------|
| `ELECTRICITY_PRICE_€_per_kWh` | `0.08` | Kosovo residential estimate; verify & tune. |
| `ANNUAL_YIELD_kWh_per_kW` | `1300` | Rough Kosovo yield for pre-sizing only. |
| `SYSTEM_LOSS_%` | `14` | PVGIS default system losses. |
| `INSTALL_COST_€_per_kW` | `900` | Turn-key install estimate; verify & tune. |
| `CO2_FACTOR_kg_per_kWh` | `0.5` | Grid emission factor; tune for Kosovo. |

> ⚠️ These are placeholder estimates. Tune with real Kosovo market data before launch.

---

## 7. Non-functional requirements
- **Responsive / mobile-first** (most end users arrive on phones).
- **Fast**: results within a couple of seconds; show loading states during geocoding + PVGIS.
- **Resilient**: graceful errors if PVGIS or Nominatim are unavailable.
- **Language**: English (MVP).
- **Currency**: EUR.

---

## 8. Design direction
- Modern **eco / green energy** vibe, energetic, clean.
- Mobile-first, large readable result numbers.
- Emphasis on sun / energy / savings imagery and color.
- Final palette & styling: designer's choice within the eco theme.

---

## 9. Success metrics
- **Completed calculations** (funnel completion rate) — proxy for lead volume.
- **Installers subscribed** (Phase 2+).
- **Monthly recurring revenue (MRR)** (Phase 2+).

---

## 10. Open questions / to confirm
- Exact **electricity price per kWh** for Kosovo residential customers.
- Realistic **install cost per kW** on the Kosovo market.
- Confirm **PVGIS dataset coverage** for Kosovo (expected: PVGIS-SARAH3).
- Final list of **Kosovo cities** for the dropdown.
