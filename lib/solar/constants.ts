/**
 * Kosovo market defaults (2025–2026 estimates).
 *
 * electricityPriceEurPerKwh — Eurostat H2 2025 ~€0.089/kWh (band 2.5–5 MWh/yr);
 *   block tariffs mean higher-use homes often pay more on marginal kWh.
 * installCostEurPerKw — turn-key residential rooftop, typically €850–1,200/kW in Kosovo.
 * annualYieldKwhPerKw — rough pre-sizing yield before PVGIS refines by coordinates.
 * co2FactorKgPerKwh — lignite-heavy Kosovo grid (~900–1,100 g CO₂/kWh per KESS/World Bank).
 */
export const SOLAR_CONSTANTS = {
  electricityPriceEurPerKwh: 0.09,
  annualYieldKwhPerKw: 1200,
  systemLossPct: 14,
  installCostEurPerKw: 1000,
  co2FactorKgPerKwh: 0.92,
} as const
