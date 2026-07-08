import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";

const violet = "#7B61FF";

const markerIcon = L.divIcon({
  html: `<svg width="22" height="26" viewBox="0 0 22 26" fill="none">
    <circle cx="11" cy="11" r="10" fill="white" stroke="${violet}" stroke-width="2"/>
    <circle cx="11" cy="11" r="4" fill="${violet}"/>
    <path d="M11 21 L9 15 L13 15 Z" fill="white" stroke="${violet}" stroke-width="1"/>
  </svg>`,
  className: "",
  iconSize: [22, 26],
  iconAnchor: [11, 26],
});

const nearbyPoints = [
  { label: "School #55", lat: 40.207, lng: 44.508, color: "#4ADE80" },
  { label: "Park", lat: 40.203, lng: 44.502, color: "#60A5FA" },
  { label: "Metro", lat: 40.202, lng: 44.510, color: "#F59E0B" },
  { label: "Supermarket", lat: 40.208, lng: 44.504, color: "#A78BFA" },
];

const poiIcon = (color) =>
  L.divIcon({
    html: `<div style="width:8px;height:8px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.15)"></div>`,
    className: "",
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });

export default function PropertyMiniMap({ property }) {
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
      setMapReady(true);
    } else {
      const id = requestAnimationFrame(() => setMapReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  if (!property) return null;
  const lat = Number(property.latitude);
  const lng = Number(property.longitude);
  if (!isFinite(lat) || !isFinite(lng)) return null;

  return (
    <div ref={containerRef} className="w-full h-[200px] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {mapReady && (
        <MapContainer
          key={property.id}
          center={[lat, lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          dragging={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[lat, lng]} icon={markerIcon} />
          {nearbyPoints.map((poi, i) => (
            <Marker key={i} position={[poi.lat, poi.lng]} icon={poiIcon(poi.color)} />
          ))}
          <Circle
            center={[lat, lng]}
            radius={400}
            pathOptions={{ color: violet, fillColor: violet, fillOpacity: 0.04, weight: 1, dashArray: "4 6" }}
          />
        </MapContainer>
      )}
    </div>
  );
}