// app/profile/components/sample_itin.tsx
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Trash2, Loader2, ChevronRight } from "lucide-react"

interface Recommendation {
  id: string
  title: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  cover_photo_url: string | null
  cover_photo_position: number | null
  updated_at: string | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function days(start?: string | null, end?: string | null) {
  if (!start || !end) return null
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
}

export function ShowGeneratedItinerary() {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchRecs() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from("itineraries")
        .select("id, title, location, start_date, end_date, cover_photo_url, cover_photo_position, updated_at")
        .eq("created_by", user.id)
        .eq("is_recommendation", true)
        .order("updated_at", { ascending: false })

      setRecs(data ?? [])
      setLoading(false)
    }
    fetchRecs()
  }, [])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const supabase = createClient()
      await supabase.from("events").delete().eq("itinerary_id", id)
      await supabase.from("itinerary_members").delete().eq("itinerary_id", id)
      await supabase.from("itineraries").delete().eq("id", id)
      setRecs(prev => prev.filter(r => r.id !== id))
      setConfirmDelete(null)
    } catch (err) {
      console.error("Failed to delete recommendation:", err)
    } finally {
      setDeleting(false)
    }
  }

  // Show only 2 most recent, third slot is "See all"
  const displayed = recs.slice(0, 2)
  const hasMore   = recs.length > 2
  const recToDelete = recs.find(r => r.id === confirmDelete)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <div>
        <p className="text-base font-semibold text-gray-800">Agent Atlas Recommendations</p>
        <p className="text-xs text-gray-400 mt-0.5">Trips Planned Just For You</p>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-gray-300">Loading...</div>
      ) : recs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 gap-2">
          <p className="text-sm">No recommendations yet.</p>
          <p className="text-xs">
            Browse our{" "}
            <Link href="/" className="text-[#b8860b] hover:text-[#F5C300] underline underline-offset-2">
              sample itineraries
            </Link>{" "}
            and export one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {displayed.map((trip) => {
            const d = days(trip.start_date, trip.end_date)
            return (
              <div key={trip.id} className="relative group rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <button
                  onClick={(e) => { e.preventDefault(); setConfirmDelete(trip.id) }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-300 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                >
                  <Trash2 size={13} />
                </button>

                <Link href={`/itinerary/${trip.id}`} className="block">
                  <div className="w-full h-24 bg-gray-200 overflow-hidden">
                    {trip.cover_photo_url ? (
                      <img
                        src={trip.cover_photo_url}
                        alt={trip.title ?? "Trip"}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `center ${trip.cover_photo_position ?? 50}%` }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        No Cover Photo
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      {trip.title ?? "Untitled Trip"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {trip.location ?? "No location"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {trip.start_date && trip.end_date
                        ? `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
                        : "No dates set"}
                    </p>
                    {d && (
                      <p className="text-xs text-gray-300">{d} {d === 1 ? "day" : "days"}</p>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}

          {/* See all — third slot, matches TripHistory pattern */}
          {hasMore && (
            <Link
              href="/profile/recommendations"
              className="rounded-xl border border-dashed border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-all flex flex-col items-center justify-center gap-2 p-4 text-center min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <ChevronRight size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">See all trips</p>
              <p className="text-xs text-gray-400">{recs.length} total</p>
            </Link>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 mx-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-gray-900">Delete recommendation?</h2>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">"{recToDelete?.title}"</span> and all its events will be permanently deleted. This cannot be undone.
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
                {deleting
                  ? <><Loader2 size={14} className="animate-spin" /> Deleting...</>
                  : "Yes, delete it"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}