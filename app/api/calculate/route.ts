import { NextRequest, NextResponse } from "next/server"

import {
  buildVerdict,
  computeSavings,
  estimateSystemSizeKw,
} from "@/lib/solar/formula"
import { fetchAnnualProduction } from "@/lib/solar/pvgis"

type CalculateBody = {
  lat?: number
  lon?: number
  monthlyBillEur?: number
}

function parseBody(body: CalculateBody) {
  const lat = body.lat
  const lon = body.lon
  const monthlyBillEur = body.monthlyBillEur

  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    typeof monthlyBillEur !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !Number.isFinite(monthlyBillEur) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180 ||
    monthlyBillEur <= 0
  ) {
    return null
  }

  return { lat, lon, monthlyBillEur }
}

export async function POST(request: NextRequest) {
  let body: CalculateBody

  try {
    body = (await request.json()) as CalculateBody
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const input = parseBody(body)

  if (!input) {
    return NextResponse.json(
      { error: "Invalid lat, lon, or monthly bill." },
      { status: 400 }
    )
  }

  try {
    const systemSizeKw = estimateSystemSizeKw(input.monthlyBillEur)
    const annualProductionKwh = await fetchAnnualProduction(
      input.lat,
      input.lon,
      systemSizeKw
    )

    const result = computeSavings({
      monthlyBillEur: input.monthlyBillEur,
      systemSizeKw,
      annualProductionKwh,
    })

    return NextResponse.json({
      ...result,
      verdict: buildVerdict(result.paybackYears),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Calculation failed."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
