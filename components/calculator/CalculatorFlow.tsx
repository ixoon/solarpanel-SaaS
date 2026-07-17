"use client"

import { useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InputForm } from "@/components/calculator/InputForm"
import { MapConfirm } from "@/components/calculator/MapConfirm"
import { Results } from "@/components/calculator/Results"
import { StepIndicator } from "@/components/calculator/StepIndicator"
import { cn } from "@/lib/utils"
import type {
  CalculatorInput,
  CalculatorStep,
  ConfirmedLocation,
} from "@/lib/solar/types"

export function CalculatorFlow() {
  const [step, setStep] = useState<CalculatorStep>("input")
  const [input, setInput] = useState<CalculatorInput | null>(null)
  const [location, setLocation] = useState<ConfirmedLocation | null>(null)

  function handleInputSubmit(data: CalculatorInput) {
    setInput(data)
    setStep("map")
  }

  function handleLocationConfirm(confirmed: ConfirmedLocation) {
    setLocation(confirmed)
    setStep("results")
  }

  return (
    <Card
      className={cn(
        "mx-auto w-full shadow-lg ring-primary/10",
        step === "map" ? "max-w-xl" : "max-w-lg"
      )}
    >
      <CardHeader className="gap-4 border-b">
        <div className="space-y-1">
          <CardTitle className="text-xl">Solar savings calculator</CardTitle>
          <CardDescription>
            Find out how much you could save with solar panels at your home.
          </CardDescription>
        </div>
        <StepIndicator currentStep={step} />
      </CardHeader>
      <CardContent className="pt-6">
        {step === "input" && <InputForm onSubmit={handleInputSubmit} />}
        {step === "map" && input && (
          <MapConfirm
            input={input}
            onBack={() => setStep("input")}
            onConfirm={handleLocationConfirm}
          />
        )}
        {step === "results" && input && location && (
          <Results
            input={input}
            location={location}
            onBack={() => setStep("map")}
          />
        )}
      </CardContent>
    </Card>
  )
}
