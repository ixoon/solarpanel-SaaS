import { NextRequest, NextResponse } from "next/server"

import type { LeadPayload } from "@/lib/leads/types"
import { getCityById } from "@/lib/geo/cities"
import { getInstallerBySlug } from "@/lib/installers/get-by-slug"
import {
  resolveLeadNotificationRecipients,
  sendLeadNotificationEmail,
} from "@/lib/email/send-lead-notification"
import { createClient } from "@/lib/supabase/server"

function parseLeadBody(body: Partial<LeadPayload>) {
  const {
    fullName,
    phone,
    email,
    city,
    address,
    lat,
    lon,
    monthlyBillEur,
    systemSizeKw,
    annualProductionKwh,
    annualSavingsEur,
    paybackYears,
    co2SavedKg,
    installerSlug,
  } = body

  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    typeof phone !== "string" ||
    !phone.trim() ||
    typeof city !== "string" ||
    !city.trim() ||
    typeof address !== "string" ||
    !address.trim() ||
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    typeof monthlyBillEur !== "number" ||
    typeof systemSizeKw !== "number" ||
    typeof annualProductionKwh !== "number" ||
    typeof annualSavingsEur !== "number" ||
    typeof paybackYears !== "number" ||
    typeof co2SavedKg !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !Number.isFinite(monthlyBillEur) ||
    monthlyBillEur <= 0
  ) {
    return null
  }

  if (email !== undefined && email !== null && typeof email !== "string") {
    return null
  }

  if (installerSlug !== undefined && typeof installerSlug !== "string") {
    return null
  }

  return {
    fullName: fullName.trim(),
    phone: phone.trim(),
    email: typeof email === "string" && email.trim() ? email.trim() : null,
    city: city.trim(),
    address: address.trim(),
    lat,
    lon,
    monthlyBillEur,
    systemSizeKw,
    annualProductionKwh,
    annualSavingsEur,
    paybackYears,
    co2SavedKg,
    installerSlug:
      typeof installerSlug === "string" && installerSlug.trim()
        ? installerSlug.trim()
        : null,
  }
}

export async function POST(request: NextRequest) {
  let body: Partial<LeadPayload>

  try {
    body = (await request.json()) as Partial<LeadPayload>
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const input = parseLeadBody(body)

  if (!input) {
    return NextResponse.json(
      { error: "Missing or invalid lead data." },
      { status: 400 }
    )
  }

  const cityRecord = getCityById(input.city)
  const cityName = cityRecord?.name ?? input.city

  let installerId: string | null = null
  let installerContactEmail: string | null = null
  let installerCompanyName: string | undefined

  if (input.installerSlug) {
    const installer = await getInstallerBySlug(input.installerSlug)
    installerId = installer?.id ?? null
    installerContactEmail = installer?.contactEmail ?? null
    installerCompanyName = installer?.companyName
  }

  const notificationRecipients = resolveLeadNotificationRecipients(
    installerContactEmail
  )

  const supabase = await createClient()

  const { error } = await supabase.from("leads").insert({
      installer_id: installerId,
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      city: cityName,
      address: input.address,
      lat: input.lat,
      lon: input.lon,
      monthly_bill_eur: input.monthlyBillEur,
      system_size_kw: input.systemSizeKw,
      annual_production_kwh: input.annualProductionKwh,
      annual_savings_eur: input.annualSavingsEur,
      payback_years: input.paybackYears,
      co2_saved_kg: input.co2SavedKg,
    })

  if (error) {
    console.error("Lead insert failed:", error.message)
    return NextResponse.json(
      { error: "Could not save your request. Please try again." },
      { status: 500 }
    )
  }

  try {
    await sendLeadNotificationEmail(
      {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        city: cityName,
        address: input.address,
        lat: input.lat,
        lon: input.lon,
        monthlyBillEur: input.monthlyBillEur,
        systemSizeKw: input.systemSizeKw,
        annualProductionKwh: input.annualProductionKwh,
        annualSavingsEur: input.annualSavingsEur,
        paybackYears: input.paybackYears,
        co2SavedKg: input.co2SavedKg,
      },
      {
        toEmails: notificationRecipients,
        installerCompanyName,
      }
    )
  } catch (emailError) {
    console.error(
      "Lead email failed:",
      emailError instanceof Error ? emailError.message : emailError
    )
  }

  return NextResponse.json({ success: true })
}
