"use client"

import { Globe, CalendarDays, Clock, Users } from "lucide-react"

interface Trip {
  id: string
  title: string
  location?: string | null
  start_date?: string | null
  end_date?: string | null
}

interface TravelStatsProps {
  trips: Trip[]
  /** Optional: total collaborators count passed from the server */
  collaboratorCount?: number
}

function getTripDays(trip: Trip): number {
  if (!trip.start_date || !trip.end_date) return 0
  const diff =
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) /
    (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(diff) + 1)
}

function countUniqueCountries(trips: Trip[]): number {
  const countries = new Set<string>()
  trips.forEach((t) => {
    if (t.location) {
      const parts = t.location.split(",").map((p) => p.trim()).filter(Boolean)
      // Use last segment if 2+ parts (e.g. "Paris, France" → "France")
      // Use first segment if only 1 part (e.g. "France" → "France")
      const country = parts.length >= 2 ? parts[parts.length - 1] : parts[0]
      if (country) countries.add(country.toLowerCase())
    }
  })
  return countries.size
}

export default function TravelStats({ trips, collaboratorCount }: TravelStatsProps) {
  const completedTrips = trips.filter(
    (t) => t.end_date && new Date(t.end_date) < new Date()
  )
  const totalDays = completedTrips.reduce((sum, t) => sum + getTripDays(t), 0)
  const countries = countUniqueCountries(completedTrips)
  const upcoming = trips.filter(
    (t) => t.start_date && new Date(t.start_date) >= new Date()
  ).length

  const stats = [
    {
      icon: Globe,
      value: countries || "—",
      label: countries === 1 ? "Country" : "Countries",
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
    {
      icon: CalendarDays,
      value: completedTrips.length || "—",
      label: completedTrips.length === 1 ? "Trip" : "Trips",
      color: "#10B981",
      bg: "#ECFDF5",
    },
    {
      icon: Clock,
      value: totalDays || "—",
      label: totalDays === 1 ? "Day" : "Days",
      color: "#8B5CF6",
      bg: "#F5F3FF",
    },
    {
      icon: Users,
      value: collaboratorCount ?? "—",
      label: "Companions",
      color: "#F59E0B",
      bg: "#FFFBEB",
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Travel Stats
      </p>
      <div className="grid grid-cols-4 gap-2">
        {stats.map(({ icon: Icon, value, label, color, bg }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-xl py-3 px-1 text-center"
            style={{ backgroundColor: bg }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center mb-1.5"
              style={{ backgroundColor: color + "22" }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2} />
            </div>
            <span className="text-base font-extrabold leading-none" style={{ color }}>
              {value}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5 font-medium leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}