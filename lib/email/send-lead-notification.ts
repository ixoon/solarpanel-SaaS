import { Resend } from "resend"

export type LeadEmailData = {
  fullName: string
  phone: string
  email: string | null
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
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

function buildLeadEmailHtml(lead: LeadEmailData): string {
  const mapsUrl = `https://www.google.com/maps?q=${lead.lat},${lead.lon}`

  return `
    <h2>New solar lead — SolarApp</h2>
    <p>Someone requested a free quote from the calculator.</p>

    <h3>Contact</h3>
    <ul>
      <li><strong>Name:</strong> ${lead.fullName}</li>
      <li><strong>Phone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></li>
      <li><strong>Email:</strong> ${lead.email ?? "—"}</li>
    </ul>

    <h3>Location</h3>
    <ul>
      <li><strong>Address:</strong> ${lead.address}, ${lead.city}</li>
      <li><strong>Coordinates:</strong> ${lead.lat.toFixed(5)}, ${lead.lon.toFixed(5)}</li>
      <li><a href="${mapsUrl}">View on map</a></li>
    </ul>

    <h3>Calculation</h3>
    <ul>
      <li><strong>Monthly bill:</strong> ${formatEur(lead.monthlyBillEur)}/month</li>
      <li><strong>Annual savings:</strong> ${formatEur(lead.annualSavingsEur)}/year</li>
      <li><strong>System size:</strong> ${lead.systemSizeKw.toFixed(1)} kW</li>
      <li><strong>Annual production:</strong> ${Math.round(lead.annualProductionKwh).toLocaleString()} kWh</li>
      <li><strong>Payback:</strong> ${lead.paybackYears.toFixed(1)} years</li>
      <li><strong>CO₂ saved:</strong> ${Math.round(lead.co2SavedKg).toLocaleString()} kg/year</li>
    </ul>
  `
}

export async function sendLeadNotificationEmail(lead: LeadEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.LEAD_NOTIFICATION_EMAIL
  const from = process.env.RESEND_FROM_EMAIL ?? "SolarApp <onboarding@resend.dev>"

  if (!apiKey || !to) {
    console.warn("Lead email skipped: RESEND_API_KEY or LEAD_NOTIFICATION_EMAIL not set.")
    return
  }

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `New solar lead: ${lead.fullName} — ${lead.city}`,
    html: buildLeadEmailHtml(lead),
  })

  if (error) {
    throw new Error(error.message)
  }
}
