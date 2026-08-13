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
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function days(start?: string | null, end?: string | null) {
  if (!start || !end) return null

  return (
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 86400000
    ) + 1
  )
}

export function ShowGeneratedItinerary() {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchRecs() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("itineraries")
        .select(
          "id, title, location, start_date, end_date, cover_photo_url, cover_photo_position, updated_at"
        )
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

      await supabase
        .from("itinerary_members")
        .delete()
        .eq("itinerary_id", id)

      await supabase.from("itineraries").delete().eq("id", id)

      setRecs((prev) => prev.filter((r) => r.id !== id))
      setConfirmDelete(null)
    } catch (err) {
      console.error("Failed to delete recommendation:", err)
    } finally {
      setDeleting(false)
    }
  }

  const displayed = recs.slice(0, 2)
  const hasMore = recs.length > 2
  const recToDelete = recs.find((r) => r.id === confirmDelete)

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-base font-semibold text-gray-800">
          Agent Atlas Recommendations
        </p>

        <p className="mt-0.5 text-xs text-gray-400">
          Trips Planned Just For You
        </p>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-gray-300">
          Loading...
        </div>
      ) : recs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-gray-400">
          <p className="text-sm">No recommendations yet.</p>

          <p className="text-xs">
            Browse our{" "}
            <Link
              href="/"
              className="text-[#b8860b] underline underline-offset-2 hover:text-[#F5C300]"
            >
              sample itineraries
            </Link>{" "}
            and export one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {displayed.map((trip) => {
            const d = days(trip.start_date, trip.end_date)

            return (
              <div
                key={trip.id}
                className="group relative overflow-hidden rounded-xl border border-gray-100 transition-shadow hover:shadow-md"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setConfirmDelete(trip.id)
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
                        alt={trip.title ?? "Trip"}
                        className="h-full w-full object-cover"
                        style={{
                          objectPosition: `center ${
                            trip.cover_photo_position ?? 50
                          }%`,
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        No Cover Photo
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 p-4">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {trip.title ?? "Untitled Trip"}
                    </p>

                    <p className="truncate text-xs text-gray-400">
                      {trip.location ?? "No location"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {trip.start_date && trip.end_date
                        ? `${formatDate(
                            trip.start_date
                          )} – ${formatDate(trip.end_date)}`
                        : "No dates set"}
                    </p>

                    {d && (
                      <p className="text-xs text-gray-300">
                        {d} {d === 1 ? "day" : "days"}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}

          {hasMore && (
            <Link
              href="/profile/recommendations"
              className="flex min-h-[170px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 p-4 text-center transition-all hover:border-yellow-400 hover:bg-yellow-50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                <ChevronRight size={20} className="text-gray-400" />
              </div>

              <p className="text-sm font-semibold text-gray-700">
                See all trips
              </p>

              <p className="text-xs text-gray-400">
                {recs.length} total
              </p>
            </Link>
          )}
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null)
          }}
        >
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-gray-900">
                Delete recommendation?
              </h2>

              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">
                  "{recToDelete?.title}"
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