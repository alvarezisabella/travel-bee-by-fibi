'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet';
import { fixLeafletIcons } from '@/lib/leaflet-fix';
import { LatLngBoundsExpression } from 'leaflet';

const CALIFORNIA_BOUNDS: LatLngBoundsExpression = [[32.5, -124.5], [42.0, -114.1]] as const;
const CALIFORNIA_CENTER: [number, number] = [36.7783, -119.4179];

export default function CaliforniaMap() {
  useEffect(() => { fixLeafletIcons(); }, []);

  return (
    <MapContainer
      center={CALIFORNIA_CENTER}
      zoom={6}
      maxBounds={CALIFORNIA_BOUNDS}
      maxBoundsViscosity={0.8}
      minZoom={5}
      style={{ height: '600px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        attribution='&copy; OpenStreetMap contributors & CARTO'
      />
      <Rectangle
        bounds={CALIFORNIA_BOUNDS}
        pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.03, dashArray: '6 4' }}
      />
    </MapContainer>
  );
}