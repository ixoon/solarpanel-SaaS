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

export type LeadEmailOptions = {
  /** Who receives the notification. Must differ from BREVO_FROM_EMAIL for reliable Gmail delivery. */
  toEmails: string[]
  installerCompanyName?: string
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function buildLeadEmailText(lead: LeadEmailData): string {
  return [
    "New solar lead — SolarApp",
    "",
    `Name: ${lead.fullName}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email ?? "—"}`,
    `Address: ${lead.address}, ${lead.city}`,
    `Coordinates: ${lead.lat.toFixed(5)}, ${lead.lon.toFixed(5)}`,
    `Monthly bill: ${formatEur(lead.monthlyBillEur)}/month`,
    `Annual savings: ${formatEur(lead.annualSavingsEur)}/year`,
    `System size: ${lead.systemSizeKw.toFixed(1)} kW`,
    `Payback: ${lead.paybackYears.toFixed(1)} years`,
  ].join("\n")
}

export function buildLeadEmailHtml(lead: LeadEmailData, installerCompanyName?: string): string {
  const mapsUrl = `https://www.google.com/maps?q=${lead.lat},${lead.lon}`
  const headline = installerCompanyName
    ? `New solar lead for ${installerCompanyName}`
    : "New solar lead — SolarApp"

  return `
    <h2>${headline}</h2>
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

type BrevoSendResponse = {
  messageId?: string
  code?: string
  message?: string
}

function formatBrevoError(status: number, body: BrevoSendResponse | null): string {
  const message = body?.message ?? `HTTP ${status}`

  if (message.toLowerCase().includes("unrecognised ip")) {
    return `${message} — In Brevo go to Security → Authorized IPs and disable IP restriction (or add your server IP). Required for local dev and Vercel.`
  }

  if (message.toLowerCase().includes("not valid") || message.toLowerCase().includes("sender")) {
    return `${message} — Verify the sender email in Brevo under Senders.`
  }

  return message
}

export function resolveLeadNotificationRecipients(
  installerContactEmail?: string | null
): string[] {
  const fromEmail = (process.env.GMAIL_USER ?? process.env.BREVO_FROM_EMAIL)
    ?.trim()
    .toLowerCase()
  const adminEmail = process.env.LEAD_NOTIFICATION_EMAIL?.trim()
  const recipients = new Set<string>()

  const installerEmail = installerContactEmail?.trim()
  if (installerEmail && installerEmail.toLowerCase() !== fromEmail) {
    recipients.add(installerEmail)
  }

  if (adminEmail && adminEmail.toLowerCase() !== fromEmail) {
    recipients.add(adminEmail)
  }

  if (recipients.size === 0) {
    const fallback = installerEmail ?? adminEmail
    if (fallback) {
      console.warn(
        "Lead email: recipient matches BREVO_FROM_EMAIL — Gmail often drops these. Use a different LEAD_NOTIFICATION_EMAIL or installer contact_email."
      )
      recipients.add(fallback)
    }
  }

  return [...recipients]
}

export async function sendLeadNotificationEmail(
  lead: LeadEmailData,
  options: LeadEmailOptions
): Promise<void> {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const { sendViaGmailSmtp } = await import("@/lib/email/send-via-gmail")
    await sendViaGmailSmtp(lead, options)
    return
  }

  await sendViaBrevo(lead, options)
}

async function sendViaBrevo(
  lead: LeadEmailData,
  options: LeadEmailOptions
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const fromEmail = process.env.BREVO_FROM_EMAIL
  const fromName = process.env.BREVO_FROM_NAME ?? "SolarApp"

  if (!apiKey || !fromEmail) {
    console.warn("Lead email skipped: BREVO_API_KEY or BREVO_FROM_EMAIL not set.")
    return
  }

  if (options.toEmails.length === 0) {
    console.warn("Lead email skipped: no recipients configured.")
    return
  }

  const subjectPrefix = options.installerCompanyName
    ? `New solar lead (${options.installerCompanyName})`
    : "New solar lead"

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: options.toEmails.map((email) => ({ email })),
      subject: `${subjectPrefix}: ${lead.fullName} — ${lead.city}`,
      htmlContent: buildLeadEmailHtml(lead, options.installerCompanyName),
      textContent: buildLeadEmailText(lead),
    }),
  })

  const body = (await response.json()) as BrevoSendResponse

  if (!response.ok) {
    throw new Error(`Brevo email failed: ${formatBrevoError(response.status, body)}`)
  }

  console.info(
    "Lead email sent via Brevo:",
    body.messageId ?? "ok",
    "→",
    options.toEmails.join(", ")
  )
}
