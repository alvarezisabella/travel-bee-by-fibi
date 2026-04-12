"use client"

import Link from "next/link"
import { formatDate } from "./TripHistory"

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
  members: TripMember[]
}

interface TripProps{
    trip: Trip;
}

export function ShowTrip({trip}: TripProps)
{
    const visible = trip.members.slice(0, 3)
    const overflow = trip.members.length - visible.length
    return (
    <div key={trip.id} className="relative group rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">

    
        <div className="w-full h-24 bg-gray-200 overflow-hidden">
        {trip.cover_photo_url ? (
            <img src={trip.cover_photo_url} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            No Cover Photo
            </div>
        )}
        </div>
        <div className="px-3 flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-700 truncate">{trip.title}</p>
        <p className="text-xs text-gray-400 truncate">{trip.location ?? "No location"}</p>
        <p className="text-xs text-gray-400">
            {trip.start_date && trip.end_date
            ? `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
            : "No dates set"}
        </p>
        {trip.members.length > 0 && (
            <div className="flex items-center mt-1">
            {visible.map((m, i) => {
                const initials = [m.first_name?.[0], m.last_name?.[0]]
                .filter(Boolean).join("").toUpperCase() || "?"
                return m.avatar_url ? (
                <img
                    key={m.user_id}
                    src={m.avatar_url}
                    title={`${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()}
                    className="w-6 h-6 rounded-full object-cover border-2 border-white"
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                />
                ) : (
                <div
                    key={m.user_id}
                    title={`${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()}
                    className="w-6 h-6 rounded-full bg-yellow-300 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-800"
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                >
                    {initials}
                </div>
                )
            })}
            {overflow > 0 && (
                <div
                className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[9px] font-semibold text-gray-500"
                style={{ marginLeft: -8 }}
                >
                +{overflow}
                </div>
            )}
            </div>
        )}
        </div>
    
    </div>
    )
}