"use client"

import { useState } from "react"
import { CheckCircle2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { LeadContact } from "@/lib/leads/types"

type LeadQuoteFormProps = {
  onSubmit: (contact: LeadContact) => Promise<void>
}

type FormErrors = Partial<Record<keyof LeadContact, string>>

function validate(values: LeadContact): FormErrors {
  const errors: FormErrors = {}

  if (!values.fullName.trim()) {
    errors.fullName = "Please enter your name."
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters."
  }

  if (!values.phone.trim()) {
    errors.phone = "Please enter your phone number."
  } else if (values.phone.replace(/\D/g, "").length < 8) {
    errors.phone = "Please enter a valid phone number."
  }

  if (values.email?.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(values.email.trim())) {
      errors.email = "Please enter a valid email address."
    }
  }

  return errors
}

export function LeadQuoteForm({ onSubmit }: LeadQuoteFormProps) {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    setSaveError(null)

    const contact: LeadContact = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
    }

    const nextErrors = validate(contact)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSaving(true)
    try {
      await onSubmit(contact)
      setSaved(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save your request.")
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-6 py-8 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <div className="space-y-1">
          <p className="font-medium">Request sent!</p>
          <p className="text-sm text-muted-foreground">
            A solar installer will contact you soon with a free quote.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-xl border bg-card p-5">
      <div className="mb-4 space-y-1">
        <h3 className="font-medium">Get a free quote</h3>
        <p className="text-sm text-muted-foreground">
          Leave your details and a solar installer will reach out with a personalized offer.
        </p>
      </div>

      <FieldGroup>
        <Field data-invalid={submitted && !!errors.fullName}>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input
            id="fullName"
            name="fullName"
            placeholder="e.g. Arben Krasniqi"
            value={fullName}
            autoComplete="name"
            aria-invalid={submitted && !!errors.fullName}
            onChange={(event) => {
              setFullName(event.target.value)
              if (submitted) setErrors((prev) => ({ ...prev, fullName: undefined }))
            }}
          />
          {submitted && errors.fullName && <FieldError>{errors.fullName}</FieldError>}
        </Field>

        <Field data-invalid={submitted && !!errors.phone}>
          <FieldLabel htmlFor="phone">Phone number</FieldLabel>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="e.g. +383 44 123 456"
            value={phone}
            autoComplete="tel"
            aria-invalid={submitted && !!errors.phone}
            onChange={(event) => {
              setPhone(event.target.value)
              if (submitted) setErrors((prev) => ({ ...prev, phone: undefined }))
            }}
          />
          {submitted && errors.phone && <FieldError>{errors.phone}</FieldError>}
        </Field>

        <Field data-invalid={submitted && !!errors.email}>
          <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            placeholder="e.g. you@email.com"
            value={email}
            autoComplete="email"
            aria-invalid={submitted && !!errors.email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (submitted) setErrors((prev) => ({ ...prev, email: undefined }))
            }}
          />
          <FieldDescription>We&apos;ll only use this to send your quote.</FieldDescription>
          {submitted && errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>

        {saveError && (
          <p className="text-sm text-destructive" role="alert">
            {saveError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Sending…" : "Request free quote"}
          {!saving && <Send data-icon="inline-end" />}
        </Button>
      </FieldGroup>
    </form>
  )
}
