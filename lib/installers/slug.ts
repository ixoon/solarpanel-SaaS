const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Normalize user input into a URL-safe installer slug. */
export function normalizeInstallerSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export function isValidInstallerSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 64 && SLUG_PATTERN.test(slug)
}

/** Suggest a slug from a company name. */
export function slugFromCompanyName(companyName: string): string {
  return normalizeInstallerSlug(companyName)
}
