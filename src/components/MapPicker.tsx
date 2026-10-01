"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

// Fix default marker icon
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({
  position,
  setPosition,
}: {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={icon} /> : null;
}

export default function MapPicker({
  onSelect,
  initialPosition,
}: {
  onSelect: (lat: number, lng: number) => void;
  initialPosition?: [number, number];
}) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialPosition || null
  );

  // Default center: Jakarta
  const center: [number, number] = initialPosition || [-6.2, 106.816];

  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 h-[300px]">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          setPosition={(pos) => {
            setPosition(pos);
            onSelect(pos[0], pos[1]);
          }}
        />
      </MapContainer>
    </div>
  );
}
