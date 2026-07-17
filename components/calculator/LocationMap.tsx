"use client"

import { useEffect } from "react"
import L from "leaflet"
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet"

import type { GeoCoordinates } from "@/lib/geo/nominatim"

import "leaflet/dist/leaflet.css"

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type LocationMapProps = {
  center: GeoCoordinates
  position: GeoCoordinates
  onPositionChange: (coords: GeoCoordinates) => void
}

function RecenterMap({ center }: { center: GeoCoordinates }) {
  const map = useMap()

  useEffect(() => {
    map.setView([center.lat, center.lon], map.getZoom())
  }, [center.lat, center.lon, map])

  return null
}

export default function LocationMap({
  center,
  position,
  onPositionChange,
}: LocationMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={16}
      scrollWheelZoom
      className="z-0 h-72 w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      <Marker
        position={[position.lat, position.lon]}
        draggable
        icon={defaultIcon}
        eventHandlers={{
          dragend: (event) => {
            const { lat, lng } = event.target.getLatLng()
            onPositionChange({ lat, lon: lng })
          },
        }}
      />
    </MapContainer>
  )
}
