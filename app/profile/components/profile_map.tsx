'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}
import { fixLeafletIcons } from '@/lib/map/leaflet-fix';
import { ShowTrip } from './show_trip';

const WORLD_CENTER: [number, number] = [20, 0];

interface TripMember {
  user_id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

interface Trip {
  id: string
  title: string
  location: string | null
  start_date: string | null
  end_date: string | null
  cover_photo_url: string | null
  lat: number | null
  lng: number | null
  members: TripMember[]
}

interface MapProps {
  trips: Trip[];
}

export default function ProfileMap({ trips }: MapProps) {
  useEffect(() => { fixLeafletIcons(); }, []);

  const tripsWithCoords = trips.filter(t => t.lat && t.lng);
  const center: [number, number] = tripsWithCoords.length > 0
    ? [
        tripsWithCoords.reduce((sum, t) => sum + t.lat!, 0) / tripsWithCoords.length,
        tripsWithCoords.reduce((sum, t) => sum + t.lng!, 0) / tripsWithCoords.length,
      ]
    : WORLD_CENTER;

  return (
    <div className='py-0'>
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4" style={{ position: 'relative', zIndex: 0 }}>
        <p className="pb-2 text-base font-semibold text-gray-800">Places I've Been</p>
        <MapContainer
          center={center}
          zoom={2}
          style={{ height: '600px', width: '100%', borderRadius: '12px', zIndex: 0, overflow: 'hidden' }}
        >
          <MapResizer />
          <TileLayer
            url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
            attribution='&copy; OpenStreetMap contributors & CARTO'
          />
          {trips.map(t => t.lat && t.lng && (
            <Marker key={t.id} position={[t.lat, t.lng]}>
              <Popup className='custom-popup'><ShowTrip trip={t} /></Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}