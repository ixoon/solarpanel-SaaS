import { createHash } from "crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE_NAME = "solarapp_admin"

export function getAdminSessionToken(): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    throw new Error("Missing ADMIN_SECRET env var.")
  }
  return createHash("sha256").update(secret).digest("hex")
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return false
  }

  const cookieStore = await cookies()
  const expected = createHash("sha256").update(secret).digest("hex")
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === expected
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  }
}
