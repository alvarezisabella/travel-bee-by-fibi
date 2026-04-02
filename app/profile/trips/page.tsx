"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trash2, Loader2 } from "lucide-react"
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

export default function AllTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchTrips = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: itineraries } = await supabase
        .from("itineraries")
        .select("id, title, location, start_date, end_date, cover_photo_url")
        .eq("created_by", user.id)

      if (!itineraries) { setLoading(false); return }

      const itineraryIds = itineraries.map((t) => t.id)

      const { data: allMembers } = itineraryIds.length > 0
        ? await supabase
            .from("itinerary_members")
            .select("itinerary_id, user_id")
            .in("itinerary_id", itineraryIds)
        : { data: [] }

      const memberUserIds = [...new Set(allMembers?.map((m) => m.user_id) ?? [])]

      const { data: profiles } = memberUserIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .in("id", memberUserIds)
        : { data: [] }

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])
      const membersByItinerary = new Map<string, typeof allMembers>()
      for (const m of allMembers ?? []) {
        const existing = membersByItinerary.get(m.itinerary_id) ?? []
        membersByItinerary.set(m.itinerary_id, [...existing, m])
      }

      const mapped = itineraries.map((trip) => {
        const members = membersByItinerary.get(trip.id) ?? []
        return {
          id: trip.id,
          title: trip.title ?? "Untitled Trip",
          location: trip.location ?? null,
          start_date: trip.start_date ?? null,
          end_date: trip.end_date ?? null,
          cover_photo_url: trip.cover_photo_url ?? null,
          members: members.map((m) => {
            const profile = profileMap.get(m.user_id)
            return {
              user_id: m.user_id,
              first_name: profile?.first_name ?? null,
              last_name: profile?.last_name ?? null,
              avatar_url: profile?.avatar_url ?? null,
            }
          }),
        }
      })

      setTrips(mapped)
      setLoading(false)
    }

    fetchTrips()
  }, [])

  const tripToDelete = trips.find((t) => t.id === confirmDelete)

  const handleDelete = async (tripId: string) => {
    setDeleting(true)
    try {
      const supabase = createClient()
      await supabase.from('events').delete().eq('itinerary_id', tripId)
      await supabase.from('itinerary_members').delete().eq('itinerary_id', tripId)
      await supabase.from('itineraries').delete().eq('id', tripId)
      setTrips((prev) => prev.filter((t) => t.id !== tripId))
      setConfirmDelete(null)
    } catch (err) {
      console.error("Failed to delete trip:", err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Trips</h1>
            <p className="text-sm text-gray-400 mt-1">
              {loading ? "Loading..." : `${trips.length} trip${trips.length !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <Link
            href="/profile"
            className="text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-full transition-all"
          >
            ← Back to profile
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <p className="text-sm">No trips yet</p>
            <p className="text-xs">Create your first trip to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {trips.map((trip) => {
              const visible = trip.members.slice(0, 3)
              const overflow = trip.members.length - visible.length

              return (
                <div key={trip.id} className="relative group rounded-xl overflow-hidden border border-gray-100 bg-white hover:shadow-md transition-shadow">

                  {/* Delete button */}
                  <button
                    onClick={() => setConfirmDelete(trip.id)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-300 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <Trash2 size={13} />
                  </button>

                  <Link href={`/itinerary/${trip.id}`} className="block">
                    <div className="w-full h-32 bg-gray-200 overflow-hidden">
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
          </div>
        )}
      </div>

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