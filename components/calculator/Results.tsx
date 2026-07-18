"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  CloudOff,
  Leaf,
  Loader2,
  RotateCcw,
  Sun,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { LeadQuoteForm } from "@/components/calculator/LeadQuoteForm"
import { Separator } from "@/components/ui/separator"
import { getCityById } from "@/lib/geo/cities"
import type { LeadContact } from "@/lib/leads/types"
import type {
  CalculationResult,
  CalculatorInput,
  ConfirmedLocation,
} from "@/lib/solar/types"

type ResultsProps = {
  input: CalculatorInput
  location: ConfirmedLocation
  onBack: () => void
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatKwh(value: number): string {
  return `${Math.round(value).toLocaleString("en-IE")} kWh`
}

function formatPayback(years: number): string {
  if (!Number.isFinite(years) || years <= 0) {
    return "—"
  }
  return `${years.toFixed(1)} years`
}

function formatCo2(kg: number): string {
  return `${Math.round(kg).toLocaleString("en-IE")} kg`
}

export function Results({ input, location, onBack }: ResultsProps) {
  const city = getCityById(input.city)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CalculationResult | null>(null)

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          monthlyBillEur: input.monthlyBillEur,
        }),
      })

      const data = (await response.json()) as CalculationResult & { error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? "Calculation failed.")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed.")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [input.monthlyBillEur, location.lat, location.lon])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  async function handleLeadSubmit(contact: LeadContact) {
    if (!result) return

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...contact,
        city: input.city,
        address: input.address,
        lat: location.lat,
        lon: location.lon,
        monthlyBillEur: input.monthlyBillEur,
        systemSizeKw: result.systemSizeKw,
        annualProductionKwh: result.annualProductionKwh,
        annualSavingsEur: result.annualSavingsEur,
        paybackYears: result.paybackYears,
        co2SavedKg: result.co2SavedKg,
      }),
    })

    const data = (await response.json()) as { error?: string }

    if (!response.ok) {
      throw new Error(data.error ?? "Could not save your request.")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="font-medium">Calculating your savings…</p>
          <p className="text-sm text-muted-foreground">
            Fetching solar data for {city?.name ?? input.city}
          </p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
          <CloudOff className="size-8 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">Couldn&apos;t calculate results</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft data-icon="inline-start" />
            Back to map
          </Button>
          <Button className="flex-1" onClick={fetchResults}>
            <RotateCcw data-icon="inline-start" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl bg-primary/8 px-5 py-6 text-center ring-1 ring-primary/15">
        <p className="text-sm font-medium text-primary">Estimated annual savings</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          {formatEur(result.annualSavingsEur)}
        </p>
        <p className="mt-3 text-sm text-muted-foreground text-balance">
          {result.verdict}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          icon={Zap}
          label="Annual production"
          value={formatKwh(result.annualProductionKwh)}
        />
        <MetricCard
          icon={Sun}
          label="Payback period"
          value={formatPayback(result.paybackYears)}
        />
        <MetricCard
          icon={Leaf}
          label="CO₂ saved per year"
          value={formatCo2(result.co2SavedKg)}
        />
        <MetricCard
          icon={Sun}
          label="Recommended system"
          value={`${result.systemSizeKw.toFixed(1)} kW`}
        />
      </div>

      <Separator />

      <LeadQuoteForm onSubmit={handleLeadSubmit} />

      <Separator />

      <p className="text-xs text-muted-foreground text-balance">
        Based on a €{input.monthlyBillEur.toFixed(0)}/month bill at{" "}
        {input.address}, {city?.name ?? input.city}. Estimates use PVGIS solar
        data and default Kosovo market assumptions — not a formal quote.
      </p>

      <Button variant="outline" onClick={onBack}>
        <ArrowLeft data-icon="inline-start" />
        Back to map
      </Button>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sun
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  )
}
