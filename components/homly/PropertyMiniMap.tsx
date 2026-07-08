'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PropertyShowcase } from '@/lib/types';

interface POI {
  label: string;
  lat: number;
  lng: number;
  type: 'schools' | 'parks' | 'metro' | 'supermarkets';
}

interface NearbyPOI {
  name: string;
  distance_m: number;
  walk_time_min: number;
  lat?: number;
  lng?: number;
}

interface NearbyResponse {
  schools?: NearbyPOI[];
  parks?: NearbyPOI[];
  metro?: NearbyPOI[];
  supermarkets?: NearbyPOI[];
}

const POI_ICONS = {
  schools: '🏫',
  parks: '🌳',
  metro: '🚇',
  supermarkets: '🛒',
};

interface PropertyMiniMapProps {
  property: PropertyShowcase;
  propertyId: string;
}

export default function PropertyMiniMap({ property, propertyId }: PropertyMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const poiMarkersRef = useRef<any[]>([]);
  const initializingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [nearbyPoints, setNearbyPoints] = useState<POI[]>([]);

  const lat = Number(property?.latitude);
  const lng = Number(property?.longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  // Fetch nearby POI from API
  useEffect(() => {
    if (!propertyId) return;

    const fetchNearbyPOI = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/nearby`);
        if (!res.ok) return;

        const data: NearbyResponse = await res.json();
        const points: POI[] = [];

        // Transform API response to map points
        // Generate approximate coordinates based on property location and distance
        const addPOIs = (items: NearbyPOI[] | undefined, type: POI['type'], baseLat: number, baseLng: number) => {
          if (!items) return;
          items.forEach((item, index) => {
            // Calculate approximate position based on distance (rough estimation)
            // Spread points around the property in different directions
            const angle = (index * 90 + Math.random() * 30) * (Math.PI / 180);
            const distanceInDegrees = (item.distance_m || 300) / 111000; // ~111km per degree
            const poiLat = baseLat + distanceInDegrees * Math.cos(angle);
            const poiLng = baseLng + distanceInDegrees * Math.sin(angle) / Math.cos(baseLat * Math.PI / 180);

            points.push({
              label: `${item.name} (${item.distance_m}m)`,
              lat: poiLat,
              lng: poiLng,
              type,
            });
          });
        };

        addPOIs(data.schools, 'schools', lat, lng);
        addPOIs(data.parks, 'parks', lat, lng);
        addPOIs(data.metro, 'metro', lat, lng);
        addPOIs(data.supermarkets, 'supermarkets', lat, lng);

        setNearbyPoints(points);
      } catch (err) {
        // Silently fail - show map without POI markers
        console.error('Failed to fetch nearby POI:', err);
      }
    };

    fetchNearbyPOI();
  }, [propertyId, lat, lng]);

  // Add POI markers when map is ready and points are loaded
  useEffect(() => {
    if (!mapInstanceRef.current || nearbyPoints.length === 0) return;

    import('leaflet').then((L) => {
      // Clear existing POI markers
      poiMarkersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {}
      });
      poiMarkersRef.current = [];

      // Add new POI markers with emoji icons
      nearbyPoints.forEach((poi) => {
        const emoji = POI_ICONS[poi.type];
        const poiIcon = L.divIcon({
          html: `<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:18px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))" title="${poi.label}">${emoji}</div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const marker = L.marker([poi.lat, poi.lng], { icon: poiIcon }).addTo(mapInstanceRef.current);
        poiMarkersRef.current.push(marker);
      });
    });
  }, [nearbyPoints, isReady]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || initializingRef.current || !hasValidCoords) return;

    // Check if container already has a Leaflet map
    if ((mapContainerRef.current as any)._leaflet_id) return;

    initializingRef.current = true;

    import('leaflet').then((L) => {
      // Check again after async import
      if (!mapContainerRef.current || mapInstanceRef.current) {
        initializingRef.current = false;
        return;
      }
      if ((mapContainerRef.current as any)._leaflet_id) {
        initializingRef.current = false;
        return;
      }

      // Fix default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

      // Property marker
      const markerIcon = L.divIcon({
        html: `<svg width="22" height="26" viewBox="0 0 22 26" fill="none">
          <circle cx="11" cy="11" r="10" fill="white" stroke="#0A6045" stroke-width="2"/>
          <circle cx="11" cy="11" r="4" fill="#0A6045"/>
          <path d="M11 21 L9 15 L13 15 Z" fill="white" stroke="#0A6045" stroke-width="1"/>
        </svg>`,
        className: '',
        iconSize: [22, 26],
        iconAnchor: [11, 26],
      });
      L.marker([lat, lng], { icon: markerIcon }).addTo(map);

      // Radius circle
      L.circle([lat, lng], {
        radius: 400,
        color: '#0A6045',
        fillColor: '#0A6045',
        fillOpacity: 0.04,
        weight: 1,
        dashArray: '4 6',
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsReady(true);
    });

    return () => {
      initializingRef.current = false;
      poiMarkersRef.current = [];
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, hasValidCoords]);

  if (!property || !hasValidCoords) {
    return (
      <div
        className="w-full h-[200px] rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ border: '1px solid rgba(200,196,188,0.3)' }}
      >
        <span className="text-gray-400 text-sm">No location data</span>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[200px] rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(200,196,188,0.3)' }}
    />
  );
}
