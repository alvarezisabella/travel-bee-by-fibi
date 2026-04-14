'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup } from 'react-leaflet';
import { fixLeafletIcons } from '@/lib/map/leaflet-fix';
import { LatLngBoundsExpression} from 'leaflet';
import { ShowTrip } from './show_trip';
const CALIFORNIA_BOUNDS: LatLngBoundsExpression = [[32.5, -124.5], [42.0, -114.1]] as const;
const CALIFORNIA_CENTER: [number, number] = [36.7783, -119.4179];

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

interface MapProps{
    trips: Trip[];
}

export default function ProfileMap({trips}:MapProps) {
  useEffect(() => { fixLeafletIcons(); }, []);
  return (
    <div className='py-4'>
    <style>
      {`
        .custom-popup .leaflet-popup-content {
        
        }
      `}
    </style>

    <div className="bg-white rounded-2xl shadow-sm p-6 gap-3">
        <p className="pb-2 text-sm font-semibold text-gray-800">Places I've Been</p>
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

            {trips.map(t => t.lat && t.lng && (
                <Marker key={t.id} position={[t.lat, t.lng]}>
                <Popup className='custom-popup'><ShowTrip trip={t}/></Popup>
                </Marker>
            ))}

        </MapContainer>
        </div>
    </div>    
  );
}