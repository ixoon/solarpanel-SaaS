export type CalculatorInput = {
  city: string
  address: string
  monthlyBillEur: number
}

export type ConfirmedLocation = {
  lat: number
  lon: number
}

export type CalculationResult = {
  systemSizeKw: number
  annualConsumptionKwh: number
  annualProductionKwh: number
  annualSavingsEur: number
  installCostEur: number
  paybackYears: number
  co2SavedKg: number
  verdict: string
}

export type CalculatorStep = "input" | "map" | "results"
