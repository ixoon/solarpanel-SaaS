import { Sun } from "lucide-react"

import { CalculatorFlow } from "@/components/calculator/CalculatorFlow"

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4 sm:px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sun className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SolarApp</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="bg-gradient-to-b from-primary/8 to-background px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl space-y-3 text-center">
            <p className="text-sm font-medium text-primary">Kosovo solar savings</p>
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
              See how much solar could save you
            </h1>
            <p className="mx-auto max-w-xl text-muted-foreground text-balance sm:text-lg">
              Enter your address and monthly electricity bill to get a personalized
              estimate — free, no signup required.
            </p>
          </div>
        </section>

        <section className="flex flex-1 justify-center px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="w-full max-w-lg -mt-8 sm:-mt-10">
            <CalculatorFlow />
          </div>
        </section>
      </main>
    </div>
  )
}
