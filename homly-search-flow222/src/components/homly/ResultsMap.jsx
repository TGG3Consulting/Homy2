import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, Circle } from "react-leaflet";
import L from "leaflet";

const createMarkerIcon = (isSelected, isTop) => {
  const size = isSelected ? 32 : 24;
  const color = isTop ? "#8B6CFF" : isSelected ? "#8B6CFF" : "#8C8880";

  const svg = `
    <svg width="${size}" height="${size + 6}" viewBox="0 0 ${size} ${size + 6}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${size / 2}" cy="${size + 1}" rx="${size / 2.5}" ry="${size / 8}" fill="rgba(0,0,0,0.12)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="white" stroke="${color}" stroke-width="2.5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 5}" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 3],
    popupAnchor: [0, -size],
  });
};

function MapUpdater({ selectedId, properties }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const prop = properties?.find((p) => p.id === selectedId);
    if (!prop) return;
    const lat = Number(prop.latitude);
    const lng = Number(prop.longitude);
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return;
    try {
      map.flyTo([lat, lng], 14, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } catch (_) {
      // map not fully initialized
    }
  }, [selectedId, map, properties]);

  return null;
}

const neighborhoods = [
  { name: "Arabkir", lat: 40.205, lng: 44.505, radius: 1800, color: "#8B6CFF" },
  { name: "Kentron", lat: 40.179, lng: 44.515, radius: 1400, color: "#B8B0A0" },
  { name: "Kanaker-Zeytun", lat: 40.215, lng: 44.535, radius: 1600, color: "#C8C0B5" },
];

export default function ResultsMap({ properties, selectedId, fullBg }) {
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef(null);
  const safeProps = properties || [];
  const selectedProp = safeProps.find((p) => p.id === selectedId);

  useEffect(() => {
    const el = containerRef.current;
    if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
      setMapReady(true);
    } else {
      const id = requestAnimationFrame(() => setMapReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative" style={{ backgroundColor: "#EDE9E1", minHeight: "300px" }}>
      {mapReady && (
        <MapContainer
          key="results-map"
          center={[40.195, 44.515]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {neighborhoods.map((n, i) => (
            <Circle
              key={i}
              center={[n.lat, n.lng]}
              radius={n.radius}
              pathOptions={{
                color: n.color,
                fillColor: n.color,
                fillOpacity: 0.04,
                weight: 1,
                dashArray: "6 6",
                opacity: 0.5,
              }}
            />
          ))}

          {safeProps.map((prop) => {
            const isSelected = prop.id === selectedId;
            const isTop = prop.is_top_choice;
            const lat = Number(prop.latitude);
            const lng = Number(prop.longitude);
            if (!isFinite(lat) || !isFinite(lng)) return null;
            return (
              <Marker
                key={prop.id}
                position={[lat, lng]}
                icon={createMarkerIcon(isSelected, isTop)}
              />
            );
          })}

          <MapUpdater selectedId={selectedId} properties={properties} />

          {selectedProp && isFinite(Number(selectedProp.latitude)) && isFinite(Number(selectedProp.longitude)) && (
            <>
              <Circle
                center={[Number(selectedProp.latitude), Number(selectedProp.longitude)]}
                radius={500}
                pathOptions={{
                  color: "#8B6CFF",
                  fillColor: "#8B6CFF",
                  fillOpacity: 0.03,
                  weight: 1,
                  opacity: 0.4,
                }}
              />
              <Circle
                center={[Number(selectedProp.latitude), Number(selectedProp.longitude)]}
                radius={1000}
                pathOptions={{
                  color: "#8B6CFF",
                  fillColor: "#8B6CFF",
                  fillOpacity: 0.02,
                  weight: 0.5,
                  opacity: 0.25,
                  dashArray: "4 8",
                }}
              />
            </>
          )}
        </MapContainer>
      )}

      {!fullBg && mapReady && (
        <div
          className="absolute bottom-4 left-4 rounded-xl px-3.5 py-2.5 text-[10px] font-body space-y-1"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(200, 196, 188, 0.3)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#8B6CFF" }} />
            <span style={{ color: "#5C5A55" }}>Recommended properties</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#8C8880" }} />
            <span style={{ color: "#5C5A55" }}>Other matches</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 flex-shrink-0" style={{ borderTop: "1px dashed #B5B3AD" }} />
            <span style={{ color: "#5C5A55" }}>Neighborhood zone</span>
          </div>
        </div>
      )}
    </div>
  );
}