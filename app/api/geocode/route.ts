import { NextRequest, NextResponse } from "next/server"

import { getCityById, getCitySearchNames } from "@/lib/geo/cities"
import { buildGeocodeQueries, geocodeAddressVariants } from "@/lib/geo/nominatim"

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim()
  const city = request.nextUrl.searchParams.get("city")?.trim()
  const cityId = request.nextUrl.searchParams.get("cityId")?.trim()

  if (!address || (!city && !cityId)) {
    return NextResponse.json(
      { error: "Missing address or city." },
      { status: 400 }
    )
  }

  const cityRecord = cityId ? getCityById(cityId) : undefined
  const cityNames = cityRecord
    ? getCitySearchNames(cityRecord)
    : city
      ? [city]
      : []

  const queries = buildGeocodeQueries(address, cityNames)
  const coordinates = await geocodeAddressVariants(queries)

  if (!coordinates) {
    return NextResponse.json(
      { error: "Address not found." },
      { status: 404 }
    )
  }

  return NextResponse.json(coordinates)
}
