import { NextRequest, NextResponse } from "next/server"

import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  getAdminSessionToken,
} from "@/lib/admin/auth"

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "Admin access is not configured." },
      { status: 503 }
    )
  }

  let password: string
  try {
    const body = (await request.json()) as { password?: string }
    password = body.password ?? ""
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (password !== secret) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE_NAME, getAdminSessionToken(), adminCookieOptions())
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...adminCookieOptions(), maxAge: 0 })
  return response
}
