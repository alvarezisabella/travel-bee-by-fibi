"use client"

import { FormEvent, useEffect, useState } from "react"
import {
  CalendarDays,
  Loader2,
  MapPin,
  Search,
  Users,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export type ExploreCategory =
  | "All"
  | "Activities"
  | "Stays"
  | "Transportation"
  | "Dining"

const categories: ExploreCategory[] = [
  "All",
  "Activities",
  "Stays",
  "Transportation",
  "Dining",
]

export interface ExploreTripInfo {
  location: string
  startDate: string
  endDate: string
  travelerCount: number
}

interface TripInfoBarProps {
  tripId: string
  activeCategory: ExploreCategory
  onCategoryChange: (category: ExploreCategory) => void
  onSearch?: (tripInfo: ExploreTripInfo) => void
}

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate && !endDate) {
    return "Dates not selected"
  }

  if (!startDate || !endDate) {
    const availableDate = startDate || endDate

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${availableDate}T00:00:00`))
  }

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  const startMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(start)

  const endMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(end)

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
  }

  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
}

export default function TripInfoBar({
  tripId,
  activeCategory,
  onCategoryChange,
  onSearch,
}: TripInfoBarProps) {
  const [tripInfo, setTripInfo] = useState<ExploreTripInfo>({
    location: "",
    startDate: "",
    endDate: "",
    travelerCount: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTripInfo() {
      if (!tripId) {
        setError("The trip ID is missing.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const supabase = createClient()

      try {
        const { data: itinerary, error: itineraryError } = await supabase
          .from("itineraries")
          .select("location, start_date, end_date")
          .eq("id", tripId)
          .single()

        if (itineraryError) {
          throw itineraryError
        }

        const { count, error: travelersError } = await supabase
          .from("itinerary_members")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("itinerary_id", tripId)

        if (travelersError) {
          throw travelersError
        }

        setTripInfo({
          location: itinerary.location || "Location not selected",
          startDate: itinerary.start_date || "",
          endDate: itinerary.end_date || "",
          travelerCount: count ?? 0,
        })
      } catch (loadError) {
        console.error("Unable to load trip information:", loadError)
        setError("We couldn't load this trip's information.")
      } finally {
        setLoading(false)
      }
    }

    loadTripInfo()
  }, [tripId])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch?.(tripInfo)
  }

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xl">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />

        <span className="ml-3 text-sm font-medium text-slate-500">
          Loading trip information...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-xl">
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:p-5"
    >
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={
              activeCategory === category
                ? "whitespace-nowrap rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                : "whitespace-nowrap rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            }
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <MapPin className="h-5 w-5 shrink-0 text-slate-400" />

          <span className="min-w-0">
            <small className="block text-xs text-slate-400">
              Where to?
            </small>

            <b className="block truncate text-sm">
              {tripInfo.location}
            </b>
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <CalendarDays className="h-5 w-5 shrink-0 text-slate-400" />

          <span className="min-w-0">
            <small className="block text-xs text-slate-400">
              Dates
            </small>

            <b className="block truncate text-sm">
              {formatDateRange(
                tripInfo.startDate,
                tripInfo.endDate,
              )}
            </b>
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <Users className="h-5 w-5 shrink-0 text-slate-400" />

          <span className="min-w-0">
            <small className="block text-xs text-slate-400">
              Travelers
            </small>

            <b className="block truncate text-sm">
              {tripInfo.travelerCount}{" "}
              {tripInfo.travelerCount === 1
                ? "traveler"
                : "travelers"}
            </b>
          </span>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-amber--400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200"
        >
          <Search className="h-5 w-5" />
          Search
        </button>
      </div>
    </form>
  )
}