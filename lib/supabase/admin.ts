import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

/**
 * Server-only Supabase client using the secret key. It bypasses RLS, so it must
 * NEVER be imported into client components. Safe because SUPABASE_SECRET_KEY has
 * no NEXT_PUBLIC_ prefix and is never exposed to the browser. Use only in Route
 * Handlers / Server Components for trusted lookups (e.g. resolving a slug).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY"
    )
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
