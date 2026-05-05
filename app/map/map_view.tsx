'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup } from 'react-leaflet';
import { fixLeafletIcons } from '../../lib/map/leaflet-fix';
import { LatLngBoundsExpression } from 'leaflet';
import { Event } from '@/app/itinerary/types/types';
import { Day } from '@/app/itinerary/day';
import { ShowEvent } from './show_event';

const CALIFORNIA_BOUNDS: LatLngBoundsExpression = [[32.5, -124.5], [42.0, -114.1]] as const;
const CALIFORNIA_CENTER: [number, number] = [36.7783, -119.4179];

interface MapProps {
  days: Day[];
}

export default function CaliforniaMap({ days }: MapProps) {
  useEffect(() => { fixLeafletIcons(); }, []);
  const [idx, setIdx] = useState(0);
  const day = days[idx];
  const visibleEvents = day?.events ?? [];

  return (
    <div className='p-4'>
      <style>
        {`
          .custom-popup .leaflet-popup-content {
            height: 8vw;
            width: 15vw;
          }
        `}
      </style>

      {/* Day navigation */}
      <div className='flex items-center justify-between px-4 py-2 bg-white rounded-t-xl border border-b-0 border-gray-200'>
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          className='text-xl px-2 disabled:opacity-30'
        >‹</button>
        <span className='text-sm font-medium text-gray-700'>
          Day {idx + 1}
          {day?.date && ` — ${new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
        </span>
        <button
          onClick={() => setIdx(i => Math.min(days.length - 1, i + 1))}
          disabled={idx === days.length - 1}
          className='text-xl px-2 disabled:opacity-30'
        >›</button>
      </div>

      <MapContainer
        center={CALIFORNIA_CENTER}
        zoom={6}
        maxBounds={CALIFORNIA_BOUNDS}
        maxBoundsViscosity={0.8}
        minZoom={5}
        style={{ height: '600px', width: '100%', borderRadius: '0 0 12px 12px' }}
      >
        <TileLayer
          url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          attribution='&copy; OpenStreetMap contributors & CARTO'
        />
        <Rectangle
          bounds={CALIFORNIA_BOUNDS}
          pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.03, dashArray: '6 4' }}
        />

        {visibleEvents.map(e => e.lat && e.lng && (
          <Marker key={e.id} position={[e.lat, e.lng]}>
            <Popup className='custom-popup'><ShowEvent event={e} /></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}