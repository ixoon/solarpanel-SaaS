import { SOLAR_CONSTANTS } from "@/lib/solar/constants"

const PVGIS_BASE = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc"

type PvgisResponse = {
  outputs?: {
    totals?: {
      fixed?: {
        E_y?: number
      }
    }
  }
}

export async function fetchAnnualProduction(
  lat: number,
  lon: number,
  peakPowerKw: number
): Promise<number> {
  const url = new URL(PVGIS_BASE)
  url.searchParams.set("lat", lat.toString())
  url.searchParams.set("lon", lon.toString())
  url.searchParams.set("peakpower", peakPowerKw.toFixed(2))
  url.searchParams.set("loss", SOLAR_CONSTANTS.systemLossPct.toString())
  url.searchParams.set("outputformat", "json")

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`PVGIS request failed (${response.status}).`)
  }

  const data = (await response.json()) as PvgisResponse
  const annualProductionKwh = data.outputs?.totals?.fixed?.E_y

  if (typeof annualProductionKwh !== "number" || annualProductionKwh <= 0) {
    throw new Error("PVGIS returned an invalid production value.")
  }

  return annualProductionKwh
}
