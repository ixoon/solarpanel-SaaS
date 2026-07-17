"use client"

import { MapPin, Sun, Zap } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CalculatorStep } from "@/lib/solar/types"

const STEPS: { id: CalculatorStep; label: string; icon: typeof Sun }[] = [
  { id: "input", label: "Your details", icon: Zap },
  { id: "map", label: "Confirm location", icon: MapPin },
  { id: "results", label: "Your savings", icon: Sun },
]

type StepIndicatorProps = {
  currentStep: CalculatorStep
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep)

  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((step, index) => {
        const Icon = step.icon
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <li key={step.id} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  !isComplete && !isCurrent && "border-border bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
              </div>
              <span
                className={cn(
                  "hidden text-center text-xs font-medium sm:block sm:text-left sm:text-sm",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "hidden h-0.5 flex-1 rounded-full sm:block",
                  index < currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
