export type LeadContact = {
  fullName: string
  phone: string
  email?: string
}

export type LeadPayload = LeadContact & {
  city: string
  address: string
  lat: number
  lon: number
  monthlyBillEur: number
  systemSizeKw: number
  annualProductionKwh: number
  annualSavingsEur: number
  paybackYears: number
  co2SavedKg: number
  installerId?: string
}
