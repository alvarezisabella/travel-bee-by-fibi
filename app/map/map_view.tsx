'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}
import { fixLeafletIcons } from '../../lib/map/leaflet-fix';
import { Day } from '@/app/itinerary/day';
import { ShowEvent } from './show_event';

const WORLD_CENTER: [number, number] = [20, 0];

interface MapProps {
  days: Day[];
}

export default function CaliforniaMap({ days }: MapProps) {
  useEffect(() => { fixLeafletIcons(); }, []);
  const [idx, setIdx] = useState(0);
  const day = days[idx];
  const visibleEvents = day?.events ?? [];

  const firstEventWithCoords = days.flatMap(d => d.events).find(e => e.lat && e.lng);
  const center: [number, number] = firstEventWithCoords
    ? [firstEventWithCoords.lat!, firstEventWithCoords.lng!]
    : WORLD_CENTER;

  return (
    <div className='p-4'>
      <style>
        {`
          .custom-popup .leaflet-popup-content {
            height: 25dvh;
            width: 40dvh;
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
        center={center}
        zoom={5}
        style={{ height: '600px', width: '100%', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}
      >
        <MapResizer />
        <TileLayer
          url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          attribution='&copy; OpenStreetMap contributors & CARTO'
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
