export type KosovoCity = {
  id: string
  name: string
  lat: number
  lon: number
  /** Alternate spellings used by Nominatim / OSM */
  aliases?: string[]
}

export const KOSOVO_CITIES: KosovoCity[] = [
  { id: "prishtina", name: "Prishtina", lat: 42.6629, lon: 21.1655 },
  { id: "prizren", name: "Prizren", lat: 42.2139, lon: 20.7397 },
  { id: "peja", name: "Peja", lat: 42.6592, lon: 20.2883, aliases: ["Pejë"] },
  { id: "gjakova", name: "Gjakova", lat: 42.3803, lon: 20.4308, aliases: ["Gjakovë"] },
  { id: "ferizaj", name: "Ferizaj", lat: 42.3702, lon: 21.1553 },
  { id: "gjilan", name: "Gjilan", lat: 42.4635, lon: 21.4699 },
  { id: "mitrovica", name: "Mitrovica", lat: 42.8914, lon: 20.866 },
  { id: "podujeva", name: "Podujeva", lat: 42.9111, lon: 21.1928 },
  { id: "vushtrri", name: "Vushtrri", lat: 42.8231, lon: 20.9675 },
  { id: "suhareka", name: "Suhareka", lat: 42.3592, lon: 20.8253 },
  { id: "rahovec", name: "Rahovec", lat: 42.3994, lon: 20.6547 },
  { id: "malisheva", name: "Malisheva", lat: 42.4828, lon: 20.7458 },
  { id: "drenas", name: "Drenas", lat: 42.6258, lon: 20.8939 },
  {
    id: "dragash",
    name: "Dragash",
    lat: 42.0628,
    lon: 20.6533,
    aliases: ["Dragaš", "Dragash"],
  },
  { id: "decan", name: "Deçan", lat: 42.5403, lon: 20.2883 },
  { id: "istog", name: "Istog", lat: 42.7808, lon: 20.4875 },
  { id: "kamenica", name: "Kamenicë", lat: 42.5781, lon: 21.5803 },
  { id: "lipjan", name: "Lipjan", lat: 42.5239, lon: 21.1258 },
  { id: "skenderaj", name: "Skenderaj", lat: 42.7464, lon: 20.7886 },
]

export function getCityById(id: string): KosovoCity | undefined {
  return KOSOVO_CITIES.find((city) => city.id === id)
}

export function getCitySearchNames(city: KosovoCity): string[] {
  return [...new Set([city.name, ...(city.aliases ?? [])])]
}
