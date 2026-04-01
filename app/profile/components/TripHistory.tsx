import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"
import NewTripButton from "./NewTripButton"
import Link from "next/link"

export default async function TripHistory() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: itineraries } = user
    ? await getItinerariesByUser(supabase, user.id)
    : { data: [] }

  // Fetch members for all itineraries in one query
  const itineraryIds = itineraries?.map((t) => t.id) ?? []

  const { data: allMembers } = itineraryIds.length > 0
    ? await supabase
        .from("itinerary_members")
        .select("itinerary_id, user_id")
        .in("itinerary_id", itineraryIds)
    : { data: [] }

  // Fetch profiles for all members in one query
  const memberUserIds = [...new Set(allMembers?.map((m) => m.user_id) ?? [])]

  const { data: profiles } = memberUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", memberUserIds)
    : { data: [] }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

  // Group members by itinerary
  const membersByItinerary = new Map<string, typeof allMembers>()
  for (const m of allMembers ?? []) {
    const existing = membersByItinerary.get(m.itinerary_id) ?? []
    membersByItinerary.set(m.itinerary_id, [...existing, m])
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-gray-800">My Trips</p>
          <p className="text-xs text-gray-400 mt-0.5">All trips created or joined</p>
        </div>
        <NewTripButton />
      </div>

      {itineraries && itineraries.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {itineraries.map((trip) => {
            const members = membersByItinerary.get(trip.id) ?? []
            const visible = members.slice(0, 3)
            const overflow = members.length - visible.length

            return (
              <Link
                key={trip.id}
                href={`/itinerary/${trip.id}`}
                className="rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Cover photo */}
                <div className="w-full h-24 bg-gray-200 overflow-hidden">
                  {trip.cover_photo_url ? (
                    <img src={trip.cover_photo_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No Cover Photo
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-3 flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-700">{trip.title ?? "Untitled Trip"}</p>
                  <p className="text-xs text-gray-400">{trip.location ?? "No location"}</p>
                  <p className="text-xs text-gray-400">
                    {trip.start_date && trip.end_date
                      ? `${trip.start_date} – ${trip.end_date}`
                      : "No dates set"}
                  </p>

                  {/* Member avatars */}
                  {members.length > 0 && (
                    <div className="flex items-center mt-2">
                      {visible.map((m, i) => {
                        const profile = profileMap.get(m.user_id)
                        const initials = [profile?.first_name?.[0], profile?.last_name?.[0]]
                          .filter(Boolean)
                          .join("")
                          .toUpperCase() || "?"

                        return profile?.avatar_url ? (
                          <img
                            key={m.user_id}
                            src={profile.avatar_url}
                            alt={initials}
                            title={`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()}
                            className="w-6 h-6 rounded-full object-cover border-2 border-white"
                            style={{ marginLeft: i === 0 ? 0 : -8 }}
                          />
                        ) : (
                          <div
                            key={m.user_id}
                            title={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()}
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
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
          <p className="text-sm">No trips yet</p>
          <p className="text-xs">Create your first trip to get started!</p>
        </div>
      )}
    </div>
  )
}