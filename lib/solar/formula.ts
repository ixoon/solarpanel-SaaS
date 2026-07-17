import { SOLAR_CONSTANTS } from "@/lib/solar/constants"

export function estimateAnnualConsumptionKwh(monthlyBillEur: number): number {
  return (monthlyBillEur / SOLAR_CONSTANTS.electricityPriceEurPerKwh) * 12
}

export function estimateSystemSizeKw(monthlyBillEur: number): number {
  const annualConsumptionKwh = estimateAnnualConsumptionKwh(monthlyBillEur)
  return annualConsumptionKwh / SOLAR_CONSTANTS.annualYieldKwhPerKw
}

export function computeSavings(params: {
  monthlyBillEur: number
  systemSizeKw: number
  annualProductionKwh: number
}) {
  const annualConsumptionKwh = estimateAnnualConsumptionKwh(params.monthlyBillEur)
  const annualSavingsEur =
    Math.min(params.annualProductionKwh, annualConsumptionKwh) *
    SOLAR_CONSTANTS.electricityPriceEurPerKwh
  const installCostEur = params.systemSizeKw * SOLAR_CONSTANTS.installCostEurPerKw
  const paybackYears =
    annualSavingsEur > 0 ? installCostEur / annualSavingsEur : Number.POSITIVE_INFINITY
  const co2SavedKg =
    params.annualProductionKwh * SOLAR_CONSTANTS.co2FactorKgPerKwh

  return {
    systemSizeKw: params.systemSizeKw,
    annualConsumptionKwh,
    annualProductionKwh: params.annualProductionKwh,
    annualSavingsEur,
    installCostEur,
    paybackYears,
    co2SavedKg,
  }
}

export function buildVerdict(paybackYears: number): string {
  if (!Number.isFinite(paybackYears) || paybackYears <= 0) {
    return "Solar may not pay off at this consumption level — consider a smaller system or higher usage."
  }

  if (paybackYears <= 8) {
    return `Strong investment — solar pays off in ~${Math.round(paybackYears)} years for your home.`
  }

  if (paybackYears <= 15) {
    return `Solar pays off in ~${Math.round(paybackYears)} years for your home.`
  }

  return `Solar pays off in ~${Math.round(paybackYears)} years — a longer-term investment for your home.`
}
