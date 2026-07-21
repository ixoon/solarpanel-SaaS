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
  /** Public installer slug; the server resolves it to an installer_id. */
  installerSlug?: string
}
