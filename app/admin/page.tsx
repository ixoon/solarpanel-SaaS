import type { Metadata } from "next"

import { AdminShell } from "@/components/admin/AdminShell"
import { isAdminAuthenticated } from "@/lib/admin/auth"

export const metadata: Metadata = {
  title: "Admin — SolarApp",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()

  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <AdminShell initialAuthenticated={authenticated} />
      </main>
    </div>
  )
}
