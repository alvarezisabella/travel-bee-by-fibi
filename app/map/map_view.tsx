'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup } from 'react-leaflet';
import { fixLeafletIcons } from '../../lib/map/leaflet-fix';
import { LatLngBoundsExpression} from 'leaflet';
import {Event} from '@/app/itinerary/types/types'
import {ShowEvent} from './show_event';
const CALIFORNIA_BOUNDS: LatLngBoundsExpression = [[32.5, -124.5], [42.0, -114.1]] as const;
const CALIFORNIA_CENTER: [number, number] = [36.7783, -119.4179];
interface MapProps{
    events: Event[];
}

export default function CaliforniaMap({events}:MapProps) {
  useEffect(() => { fixLeafletIcons(); }, []);
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

      {events.map(e => e.lat && e.lng && (
        <Marker key={e.id} position={[e.lat, e.lng]}>
          <Popup className='custom-popup'> <ShowEvent event={e}/></Popup>
        </Marker>
      ))}

    </MapContainer>
    </div>
  );
}