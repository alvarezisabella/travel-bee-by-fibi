"use client"

import { useEffect, useState } from "react"
import { MapPin, Plane } from "lucide-react"

interface Trip {
  id: string
  title: string
  location?: string | null
  start_date?: string | null
  end_date?: string | null
  cover_photo_url?: string | null
}

interface TripCountdownProps {
  trips: Trip[]
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function TripCountdown({ trips }: TripCountdownProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Find the next upcoming trip (soonest future start_date)
  const upcomingTrips = trips
    .filter((t) => t.start_date)
    .map((t) => ({ ...t, daysUntil: getDaysUntil(t.start_date!) }))
    .filter((t) => t.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const nextTrip = upcomingTrips[0]

  if (!mounted || !nextTrip) return null

  const tripDuration =
    nextTrip.start_date && nextTrip.end_date
      ? Math.ceil(
          (new Date(nextTrip.end_date).getTime() - new Date(nextTrip.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : null

  const isToday = nextTrip.daysUntil === 0
  const isTomorrow = nextTrip.daysUntil === 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Cover photo strip or gradient header */}
      <div className="relative h-16 overflow-hidden">
        {nextTrip.cover_photo_url ? (
          <>
            <img
              src={nextTrip.cover_photo_url}
              alt={nextTrip.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-300" />
        )}

        {/* Bee yellow accent label */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5">
          <Plane className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          <span className="text-white text-xs font-semibold tracking-wide uppercase">
            Next Trip
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight">
              {nextTrip.title}
            </h3>
            {nextTrip.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate">{nextTrip.location}</span>
              </div>
            )}
            {nextTrip.start_date && (
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(nextTrip.start_date)}
                {tripDuration ? ` · ${tripDuration} day${tripDuration !== 1 ? "s" : ""}` : ""}
              </p>
            )}
          </div>

          {/* Countdown badge */}
          <div className="flex-shrink-0 text-center">
            <div
              className="rounded-xl px-3 py-2 min-w-[56px]"
              style={{ backgroundColor: "#FFF8DC", border: "1.5px solid #F5C300" }}
            >
              {isToday ? (
                <span className="text-sm font-bold" style={{ color: "#B8860B" }}>
                  Today!
                </span>
              ) : isTomorrow ? (
                <span className="text-sm font-bold" style={{ color: "#B8860B" }}>
                  Tomorrow
                </span>
              ) : (
                <>
                  <div className="text-xl font-extrabold leading-none" style={{ color: "#B8860B" }}>
                    {nextTrip.daysUntil}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#B8860B", opacity: 0.8 }}>
                    days
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar: how far through the countdown are we? */}
        {nextTrip.daysUntil > 0 && nextTrip.daysUntil <= 90 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-400">Today</span>
              <span className="text-[10px] text-gray-400">Departure</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  backgroundColor: "#F5C300",
                  width: `${Math.max(4, ((90 - nextTrip.daysUntil) / 90) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}