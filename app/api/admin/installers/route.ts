import { NextRequest, NextResponse } from "next/server"

import { isAdminAuthenticated } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isValidInstallerSlug,
  normalizeInstallerSlug,
} from "@/lib/installers/slug"

const SUBSCRIPTION_STATUSES = ["trial", "active", "past_due", "canceled"] as const

type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

function parseInstallerBody(body: Record<string, unknown>) {
  const companyName =
    typeof body.companyName === "string" ? body.companyName.trim() : ""
  const contactEmail =
    typeof body.contactEmail === "string" ? body.contactEmail.trim() : ""
  const phone =
    typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null
  const slug = normalizeInstallerSlug(
    typeof body.slug === "string" ? body.slug : ""
  )
  const subscriptionStatus =
    typeof body.subscriptionStatus === "string"
      ? body.subscriptionStatus.trim()
      : "trial"

  if (!companyName || companyName.length < 2) {
    return { error: "Company name is required." as const }
  }

  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: "A valid contact email is required." as const }
  }

  if (!isValidInstallerSlug(slug)) {
    return {
      error:
        "Slug must be 2–64 characters, lowercase letters, numbers, and hyphens only.",
    } as const
  }

  if (!SUBSCRIPTION_STATUSES.includes(subscriptionStatus as SubscriptionStatus)) {
    return { error: "Invalid subscription status." as const }
  }

  return {
    data: {
      companyName,
      contactEmail,
      phone,
      slug,
      subscriptionStatus: subscriptionStatus as SubscriptionStatus,
    },
  }
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("installers")
    .select(
      "id, company_name, contact_email, phone, slug, subscription_status, created_at"
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Installer list failed:", error.message)
    return NextResponse.json(
      { error: "Could not load installers." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    installers: (data ?? []).map((row) => ({
      id: row.id,
      companyName: row.company_name,
      contactEmail: row.contact_email,
      phone: row.phone,
      slug: row.slug,
      subscriptionStatus: row.subscription_status,
      createdAt: row.created_at,
    })),
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = parseInstallerBody(body)
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("installers")
    .insert({
      company_name: parsed.data.companyName,
      contact_email: parsed.data.contactEmail,
      phone: parsed.data.phone,
      slug: parsed.data.slug,
      subscription_status: parsed.data.subscriptionStatus,
    })
    .select(
      "id, company_name, contact_email, phone, slug, subscription_status, created_at"
    )
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That slug is already taken. Choose another." },
        { status: 409 }
      )
    }
    console.error("Installer insert failed:", error.message)
    return NextResponse.json(
      { error: "Could not create installer." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    installer: {
      id: data.id,
      companyName: data.company_name,
      contactEmail: data.contact_email,
      phone: data.phone,
      slug: data.slug,
      subscriptionStatus: data.subscription_status,
      createdAt: data.created_at,
    },
  })
}
