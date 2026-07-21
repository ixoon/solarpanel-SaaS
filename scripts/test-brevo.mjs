import { readFileSync } from "node:fs"

function loadEnvLocal() {
  const lines = readFileSync(".env.local", "utf8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    process.env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
  }
}

loadEnvLocal()

const apiKey = process.env.BREVO_API_KEY
const fromEmail = process.env.BREVO_FROM_EMAIL
const fromName = process.env.BREVO_FROM_NAME ?? "SolarApp"
const to = process.env.LEAD_NOTIFICATION_EMAIL

if (!apiKey || !fromEmail || !to) {
  console.error("Missing Brevo env vars")
  process.exit(1)
}

const response = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    "api-key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to, name: "Test recipient" }],
    subject: "SolarApp Brevo test — different recipient",
    htmlContent: "<p>If you see this, Brevo delivery works.</p>",
    textContent: "If you see this, Brevo delivery works.",
  }),
})

const text = await response.text()
console.log("Status:", response.status)
console.log("Body:", text)

if (response.ok) {
  console.log("\nBrevo accepted the email. Check inbox + spam for:", to)
} else {
  console.log("\nBrevo rejected the email. Fix the issue above.")
  process.exit(1)
}
