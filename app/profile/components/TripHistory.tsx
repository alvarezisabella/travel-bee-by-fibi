"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
  updated_at?: string | null
  members: TripMember[]
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function TripCard({
  trip,
  onDelete,
}: {
  trip: Trip
  onDelete: (id: string) => void
}) {
  const visible = trip.members.slice(0, 3)
  const overflow = trip.members.length - visible.length

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 transition-shadow hover:shadow-md">
      <button
        onClick={(e) => {
          e.preventDefault()
          onDelete(trip.id)
        }}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-400 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>

      <Link href={`/itinerary/${trip.id}`} className="block">
        <div className="h-36 w-full overflow-hidden bg-gray-200 sm:h-32 lg:h-28">
          {trip.cover_photo_url ? (
            <img
              src={trip.cover_photo_url}
              className="h-full w-full object-cover"
              alt={trip.title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
              No Cover Photo
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 p-4">
          <p className="truncate text-sm font-semibold text-gray-800">
            {trip.title}
          </p>

          <p className="truncate text-xs text-gray-400">
            {trip.location ?? "No location"}
          </p>

          <p className="text-xs text-gray-400">
            {trip.start_date && trip.end_date
              ? `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
              : "No dates set"}
          </p>

          {trip.members.length > 0 && (
            <div className="mt-2 flex items-center">
              {visible.map((m, i) => {
                const initials =
                  [m.first_name?.[0], m.last_name?.[0]]
                    .filter(Boolean)
                    .join("")
                    .toUpperCase() || "?"

                return m.avatar_url ? (
                  <img
                    key={m.user_id}
                    src={m.avatar_url}
                    title={`${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()}
                    className="h-6 w-6 rounded-full border-2 border-white object-cover"
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                    alt=""
                  />
                ) : (
                  <div
                    key={m.user_id}
                    title={`${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-yellow-300 text-[9px] font-bold text-gray-800"
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                  >
                    {initials}
                  </div>
                )
              })}

              {overflow > 0 && (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[9px] font-semibold text-gray-500"
                  style={{ marginLeft: -8 }}
                >
                  +{overflow}
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}

function TripHistoryCarousel({ trips: initialTrips }: { trips: Trip[] }) {
  const [trips, setTrips] = useState(initialTrips)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sorted = [...trips].sort((a, b) => {
    const at = a.updated_at ? new Date(a.updated_at).getTime() : 0
    const bt = b.updated_at ? new Date(b.updated_at).getTime() : 0
    return bt - at
  })

  const displayed = sorted.slice(0, 2)
  const hasMore = trips.length > 2

  const handleDelete = async (tripId: string) => {
    setDeleting(true)

    try {
      const supabase = createClient()

      await supabase.from("events").delete().eq("itinerary_id", tripId)
      await supabase.from("itinerary_members").delete().eq("itinerary_id", tripId)
      await supabase.from("itineraries").delete().eq("id", tripId)

      setTrips((prev) => prev.filter((t) => t.id !== tripId))
      setConfirmDelete(null)
    } catch (err) {
      console.error("Failed to delete trip:", err)
    } finally {
      setDeleting(false)
    }
  }

  const tripToDelete = trips.find((t) => t.id === confirmDelete)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {displayed.map((trip) => (
          <TripCard key={trip.id} trip={trip} onDelete={setConfirmDelete} />
        ))}

        {hasMore && (
          <Link
            href="/profile/trips"
            className="flex min-h-[170px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 p-4 text-center transition-all hover:border-yellow-400 hover:bg-yellow-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              <ChevronRight size={20} className="text-gray-400" />
            </div>

            <p className="text-sm font-semibold text-gray-700">
              See all trips
            </p>

            <p className="text-xs text-gray-400">{trips.length} total</p>
          </Link>
        )}
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null)
          }}
        >
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-gray-900">
                Delete trip?
              </h2>

              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">
                  "{tripToDelete?.title}"
                </span>{" "}
                and all its events will be permanently deleted. This cannot be
                undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, delete it"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TripHistory({ trips }: { trips: Trip[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-gray-800">My Trips</p>
          <p className="mt-0.5 text-xs text-gray-400">
            All trips created or joined
          </p>
        </div>

        <NewTripButton />
      </div>

      {trips.length > 0 ? (
        <TripHistoryCarousel trips={trips} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
          <p className="text-sm">No trips yet</p>
          <p className="text-xs">Create your first trip to get started!</p>
        </div>
      )}
    </div>
  )
}

function NewTripButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleNewTrip = async () => {
    setLoading(true)

    try {
      const res = await fetch("/api/auth/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (res.ok && data.itinerary?.id) {
        router.push(`/itinerary/${data.itinerary.id}`)
      }
    } catch (err) {
      console.error("Failed to create trip:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleNewTrip}
      disabled={loading}
      className="flex h-10 w-full items-center justify-center rounded-full bg-[#F5C842] px-4 text-xs font-semibold text-gray-900 transition-all hover:bg-[#e6b93a] disabled:opacity-50 sm:w-auto sm:min-w-32"
    >
      {loading ? "Creating..." : "+ New Trip"}
    </button>
  )
}