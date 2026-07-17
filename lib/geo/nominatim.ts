export type GeoCoordinates = {
  lat: number
  lon: number
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = "SolarApp/1.0 (solar savings calculator; contact@example.com)"

type GeocodeOptions = {
  countryCodes?: string
}

async function geocodeQuery(
  query: string,
  options: GeocodeOptions = { countryCodes: "xk" }
): Promise<GeoCoordinates | null> {
  const url = new URL(NOMINATIM_BASE)
  url.searchParams.set("q", query)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")

  if (options.countryCodes) {
    url.searchParams.set("countrycodes", options.countryCodes)
  }

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as Array<{ lat: string; lon: string }>
  const match = data[0]

  if (!match) {
    return null
  }

  return {
    lat: parseFloat(match.lat),
    lon: parseFloat(match.lon),
  }
}

export async function geocodeAddress(query: string): Promise<GeoCoordinates | null> {
  return geocodeQuery(query)
}

export async function geocodeAddressVariants(
  queries: string[]
): Promise<GeoCoordinates | null> {
  const uniqueQueries = [...new Set(queries.filter(Boolean))]

  for (const query of uniqueQueries) {
    const result = await geocodeQuery(query, { countryCodes: "xk" })
    if (result) return result
  }

  for (const query of uniqueQueries) {
    const result = await geocodeQuery(query, { countryCodes: undefined })
    if (result) return result
  }

  return null
}

export function buildGeocodeQueries(
  address: string,
  cityNames: string[]
): string[] {
  const queries: string[] = []

  for (const city of cityNames) {
    queries.push(`${address}, ${city}, Kosovo`)
    queries.push(`${address}, ${city}, Kosova`)
  }

  return queries
}
