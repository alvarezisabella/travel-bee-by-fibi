"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react"
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
  members: TripMember[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

const PAGE_SIZE = 3

function TripHistoryCarousel({ trips: initialTrips }: { trips: Trip[] }) {
  const router = useRouter()
  const [trips, setTrips] = useState(initialTrips)
  const [page, setPage] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const totalPages = Math.ceil(trips.length / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const pageTrips = trips.slice(start, start + PAGE_SIZE)
  const isLastPage = page === totalPages - 1
  const showSeeAll = trips.length > PAGE_SIZE

  const handleDelete = async (tripId: string) => {
    setDeleting(true)
    try {
      const supabase = createClient()

      // Delete all events first
      await supabase.from('events').delete().eq('itinerary_id', tripId)

      // Delete itinerary members
      await supabase.from('itinerary_members').delete().eq('itinerary_id', tripId)

      // Delete the itinerary
      await supabase.from('itineraries').delete().eq('id', tripId)

      // Remove from local state so UI updates instantly
      setTrips((prev) => prev.filter((t) => t.id !== tripId))
      setConfirmDelete(null)

      // If current page is now empty, go back one page
      const newTrips = trips.filter((t) => t.id !== tripId)
      const newTotalPages = Math.ceil(newTrips.length / PAGE_SIZE)
      if (page >= newTotalPages && page > 0) setPage((p) => p - 1)

    } catch (err) {
      console.error("Failed to delete trip:", err)
    } finally {
      setDeleting(false)
    }
  }

  const tripToDelete = trips.find((t) => t.id === confirmDelete)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">

        {/* Left arrow */}
        {page > 0 && (
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-[#F5C842] hover:text-gray-900 hover:border-[#F5C842] active:scale-95 transition-all shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3">
          {pageTrips.map((trip) => {
            const visible = trip.members.slice(0, 3)
            const overflow = trip.members.length - visible.length

            return (
              <div key={trip.id} className="relative group rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">

                {/* Delete button */}
                <button
                  onClick={(e) => { e.preventDefault(); setConfirmDelete(trip.id) }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-300 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                >
                  <Trash2 size={13} />
                </button>

                <Link href={`/itinerary/${trip.id}`} className="block">
                  <div className="w-full h-24 bg-gray-200 overflow-hidden">
                    {trip.cover_photo_url ? (
                      <img src={trip.cover_photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        No Cover Photo
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1">
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
                </Link>
              </div>
            )
          })}

          {/* See all card */}
          {isLastPage && showSeeAll && (
            <Link
              href="/profile/trips"
              className="rounded-xl border border-dashed border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-all flex flex-col items-center justify-center gap-2 p-4 text-center min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <ChevronRight size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">See all trips</p>
              <p className="text-xs text-gray-400">{trips.length} total</p>
            </Link>
          )}
        </div>

        {/* Right arrow */}
        {page < totalPages - 1 && (
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-[#F5C842] hover:text-gray-900 hover:border-[#F5C842] active:scale-95 transition-all shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Page indicator */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-1">
          <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 mx-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-gray-900">Delete trip?</h2>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">"{tripToDelete?.title}"</span> and all its events will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : "Yes, delete it"}
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
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-gray-800">My Trips</p>
          <p className="text-xs text-gray-400 mt-0.5">All trips created or joined</p>
        </div>
        <NewTripButton />
      </div>

      {trips.length > 0 ? (
        <TripHistoryCarousel trips={trips} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
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
      className="h-8 px-4 bg-[#F5C842] hover:bg-[#e6b93a] rounded-full flex items-center justify-center text-xs font-semibold text-gray-900 transition-all disabled:opacity-50"
    >
      {loading ? "Creating..." : "+ New Trip"}
    </button>
  )
}