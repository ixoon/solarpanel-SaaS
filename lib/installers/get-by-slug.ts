import { createAdminClient } from "@/lib/supabase/admin"

export type Installer = {
  id: string
  companyName: string
  contactEmail: string
  slug: string
  subscriptionStatus: string
}

const ACTIVE_STATUSES = new Set(["trial", "active"])

/**
 * Resolve an installer by its public slug using the admin (secret) client so it
 * works for anonymous calculator visitors despite RLS. Returns null when the
 * slug does not exist.
 */
export async function getInstallerBySlug(
  slug: string
): Promise<Installer | null> {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return null

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("installers")
    .select("id, company_name, contact_email, slug, subscription_status")
    .eq("slug", normalized)
    .maybeSingle()

  if (error) {
    console.error("Installer lookup failed:", error.message)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    companyName: data.company_name,
    contactEmail: data.contact_email,
    slug: data.slug,
    subscriptionStatus: data.subscription_status,
  }
}

/** Whether an installer is allowed to receive new leads. */
export function isInstallerActive(installer: Installer): boolean {
  return ACTIVE_STATUSES.has(installer.subscriptionStatus)
}
