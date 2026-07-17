"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, Loader2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getCityById } from "@/lib/geo/cities"
import type { GeoCoordinates } from "@/lib/geo/nominatim"
import type { CalculatorInput, ConfirmedLocation } from "@/lib/solar/types"

const LocationMap = dynamic(() => import("@/components/calculator/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-xl bg-muted">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

type MapConfirmProps = {
  input: CalculatorInput
  onBack: () => void
  onConfirm: (location: ConfirmedLocation) => void
}

export function MapConfirm({ input, onBack, onConfirm }: MapConfirmProps) {
  const city = getCityById(input.city)
  const fallbackCenter: GeoCoordinates = {
    lat: city?.lat ?? 42.6629,
    lon: city?.lon ?? 21.1655,
  }

  const [loading, setLoading] = useState(true)
  const [geocodeFailed, setGeocodeFailed] = useState(false)
  const [center, setCenter] = useState<GeoCoordinates>(fallbackCenter)
  const [position, setPosition] = useState<GeoCoordinates>(fallbackCenter)

  useEffect(() => {
    let cancelled = false

    async function loadLocation() {
      setLoading(true)
      setGeocodeFailed(false)

      try {
        const params = new URLSearchParams({
          address: input.address,
          city: city?.name ?? input.city,
          cityId: input.city,
        })
        const response = await fetch(`/api/geocode?${params.toString()}`)

        if (cancelled) return

        if (response.ok) {
          const coordinates = (await response.json()) as GeoCoordinates
          setCenter(coordinates)
          setPosition(coordinates)
        } else {
          setGeocodeFailed(true)
          setCenter(fallbackCenter)
          setPosition(fallbackCenter)
        }
      } catch {
        if (cancelled) return
        setGeocodeFailed(true)
        setCenter(fallbackCenter)
        setPosition(fallbackCenter)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadLocation()

    return () => {
      cancelled = true
    }
  }, [input.address, input.city, city?.name, fallbackCenter.lat, fallbackCenter.lon])

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="size-4 text-primary" />
          Confirm your roof location
        </div>
        <p className="text-sm text-muted-foreground">
          {input.address}, {city?.name ?? input.city}
        </p>
        {geocodeFailed && !loading && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            We couldn&apos;t find that exact address — drag the pin to your home.
          </p>
        )}
        {!geocodeFailed && !loading && (
          <p className="text-sm text-muted-foreground">
            Drag the pin if it isn&apos;t exactly on your roof.
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-xl bg-muted">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            <span className="text-sm">Finding your address…</span>
          </div>
        </div>
      ) : (
        <LocationMap
          center={center}
          position={position}
          onPositionChange={setPosition}
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <Button
          className="flex-1"
          size="lg"
          disabled={loading}
          onClick={() => onConfirm({ lat: position.lat, lon: position.lon })}
        >
          Calculate savings
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
