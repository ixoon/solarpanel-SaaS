"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { KOSOVO_CITIES } from "@/lib/geo/cities"
import type { CalculatorInput } from "@/lib/solar/types"

type InputFormProps = {
  defaultValues?: Partial<CalculatorInput>
  onSubmit: (data: CalculatorInput) => void
}

type FormErrors = Partial<Record<keyof CalculatorInput, string>>

function validate(values: CalculatorInput): FormErrors {
  const errors: FormErrors = {}

  if (!values.city) {
    errors.city = "Please select your city."
  }

  if (!values.address.trim()) {
    errors.address = "Please enter your street address."
  }

  if (!values.monthlyBillEur || values.monthlyBillEur <= 0) {
    errors.monthlyBillEur = "Enter a positive monthly bill amount."
  } else if (values.monthlyBillEur > 10000) {
    errors.monthlyBillEur = "That bill seems unusually high — please double-check."
  }

  return errors
}

export function InputForm({ defaultValues, onSubmit }: InputFormProps) {
  const [city, setCity] = useState(defaultValues?.city ?? "")
  const [address, setAddress] = useState(defaultValues?.address ?? "")
  const [monthlyBill, setMonthlyBill] = useState(
    defaultValues?.monthlyBillEur?.toString() ?? ""
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)

    const data: CalculatorInput = {
      city,
      address: address.trim(),
      monthlyBillEur: parseFloat(monthlyBill),
    }

    const nextErrors = validate(data)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      onSubmit(data)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={submitted && !!errors.city}>
          <FieldLabel htmlFor="city">City</FieldLabel>
          <Select
            value={city || null}
            onValueChange={(value) => {
              setCity(value ?? "")
              if (submitted) {
                setErrors((prev) => ({ ...prev, city: undefined }))
              }
            }}
          >
            <SelectTrigger id="city" className="w-full" aria-invalid={submitted && !!errors.city}>
              <SelectValue placeholder="Select your city" />
            </SelectTrigger>
            <SelectContent>
              {KOSOVO_CITIES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {submitted && errors.city && <FieldError>{errors.city}</FieldError>}
        </Field>

        <Field data-invalid={submitted && !!errors.address}>
          <FieldLabel htmlFor="address">Street address</FieldLabel>
          <Input
            id="address"
            name="address"
            placeholder="e.g. Rr. Nëna Terezë 12"
            value={address}
            aria-invalid={submitted && !!errors.address}
            onChange={(event) => {
              setAddress(event.target.value)
              if (submitted) {
                setErrors((prev) => ({ ...prev, address: undefined }))
              }
            }}
          />
          <FieldDescription>
            We&apos;ll use this to find your home on the map in the next step.
          </FieldDescription>
          {submitted && errors.address && <FieldError>{errors.address}</FieldError>}
        </Field>

        <Field data-invalid={submitted && !!errors.monthlyBillEur}>
          <FieldLabel htmlFor="monthlyBill">Monthly electricity bill (€)</FieldLabel>
          <Input
            id="monthlyBill"
            name="monthlyBill"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            placeholder="e.g. 45"
            value={monthlyBill}
            aria-invalid={submitted && !!errors.monthlyBillEur}
            onChange={(event) => {
              setMonthlyBill(event.target.value)
              if (submitted) {
                setErrors((prev) => ({ ...prev, monthlyBillEur: undefined }))
              }
            }}
          />
          <FieldDescription>
            Your average monthly electricity cost — used to estimate system size.
          </FieldDescription>
          {submitted && errors.monthlyBillEur && (
            <FieldError>{errors.monthlyBillEur}</FieldError>
          )}
        </Field>

        <Button type="submit" size="lg" className="w-full">
          Continue to map
          <ArrowRight data-icon="inline-end" />
        </Button>
      </FieldGroup>
    </form>
  )
}
