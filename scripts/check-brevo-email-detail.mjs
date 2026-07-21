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
const uuid = process.argv[2] ?? "e21d8d5f-04b0-41a4-b036-871f768bd6aa"

const response = await fetch(`https://api.brevo.com/v3/smtp/emails/${uuid}`, {
  headers: {
    "api-key": apiKey ?? "",
    Accept: "application/json",
  },
})

console.log("Status:", response.status)
console.log(JSON.stringify(await response.json(), null, 2))
