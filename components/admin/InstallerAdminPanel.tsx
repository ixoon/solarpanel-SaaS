"use client"

import { useEffect, useState } from "react"
import { Copy, ExternalLink, LogOut, Plus } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { slugFromCompanyName } from "@/lib/installers/slug"
import { cn } from "@/lib/utils"

type InstallerRow = {
  id: string
  companyName: string
  contactEmail: string
  phone: string | null
  slug: string
  subscriptionStatus: string
  createdAt: string
}

type FormState = {
  companyName: string
  contactEmail: string
  phone: string
  slug: string
  subscriptionStatus: string
}

const EMPTY_FORM: FormState = {
  companyName: "",
  contactEmail: "",
  phone: "",
  slug: "",
  subscriptionStatus: "trial",
}

type FormErrors = Partial<Record<keyof FormState, string>>

export function InstallerAdminPanel() {
  const [installers, setInstallers] = useState<InstallerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  async function loadInstallers() {
    setLoading(true)
    setLoadError(null)

    try {
      const response = await fetch("/api/admin/installers")
      const data = (await response.json()) as {
        installers?: InstallerRow[]
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load installers.")
      }

      setInstallers(data.installers ?? [])
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load installers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstallers()
  }, [])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "companyName" && !slugTouched) {
        next.slug = slugFromCompanyName(String(value))
      }
      return next
    })
    setFormErrors((prev) => ({ ...prev, [key]: undefined }))
    setSubmitError(null)
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" })
    window.location.reload()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitting(true)

    try {
      const response = await fetch("/api/admin/installers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = (await response.json()) as {
        installer?: InstallerRow
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create installer.")
      }

      if (data.installer) {
        setInstallers((prev) => [data.installer!, ...prev])
      }

      setForm(EMPTY_FORM)
      setSlugTouched(false)
      setFormErrors({})
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create installer.")
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCalculatorLink(slug: string) {
    const url = `${window.location.origin}/i/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    window.setTimeout(() => setCopiedSlug(null), 2000)
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Installer admin</h1>
          <p className="text-sm text-muted-foreground">
            Add solar companies and copy their calculator links.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut data-icon="inline-start" />
          Sign out
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-2">
          <Plus className="size-4 text-primary" />
          <h2 className="font-medium">Add installer</h2>
        </div>

        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!formErrors.companyName}>
              <FieldLabel htmlFor="companyName">Company name</FieldLabel>
              <Input
                id="companyName"
                value={form.companyName}
                placeholder="e.g. Solar Kosovo"
                onChange={(event) => updateField("companyName", event.target.value)}
              />
              {formErrors.companyName && (
                <FieldError>{formErrors.companyName}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!formErrors.contactEmail}>
              <FieldLabel htmlFor="contactEmail">Contact email</FieldLabel>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                placeholder="e.g. info@solarkosovo.com"
                onChange={(event) => updateField("contactEmail", event.target.value)}
              />
              {formErrors.contactEmail && (
                <FieldError>{formErrors.contactEmail}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                placeholder="e.g. +383 44 123 456"
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </Field>

            <Field data-invalid={!!formErrors.slug}>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input
                id="slug"
                value={form.slug}
                placeholder="e.g. solar-kosovo"
                onChange={(event) => {
                  setSlugTouched(true)
                  updateField("slug", event.target.value)
                }}
              />
              <FieldDescription>
                Used in the calculator URL: /i/{form.slug || "your-slug"}
              </FieldDescription>
              {formErrors.slug && <FieldError>{formErrors.slug}</FieldError>}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="subscriptionStatus">Subscription status</FieldLabel>
            <Select
              value={form.subscriptionStatus}
              onValueChange={(value) =>
                updateField("subscriptionStatus", value ?? "trial")
              }
            >
              <SelectTrigger id="subscriptionStatus" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create installer"}
          </Button>
        </FieldGroup>
      </form>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-medium">Installers</h2>

        {loading && (
          <p className="text-sm text-muted-foreground">Loading installers…</p>
        )}

        {loadError && (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        )}

        {!loading && !loadError && installers.length === 0 && (
          <p className="text-sm text-muted-foreground">No installers yet.</p>
        )}

        {!loading && installers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Company</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Slug</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {installers.map((installer) => (
                  <tr key={installer.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{installer.companyName}</td>
                    <td className="py-3 pr-4">{installer.contactEmail}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{installer.slug}</td>
                    <td className="py-3 pr-4 capitalize">{installer.subscriptionStatus}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyCalculatorLink(installer.slug)}
                        >
                          <Copy data-icon="inline-start" />
                          {copiedSlug === installer.slug ? "Copied!" : "Copy link"}
                        </Button>
                        <a
                          href={`/i/${installer.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                        >
                          <ExternalLink data-icon="inline-start" />
                          Open
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
