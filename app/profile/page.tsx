// app/profile/page.tsx
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"
import ProfileHeader from "./components/ProfileHeader"
import TripHistory from "./components/TripHistory"
import ProfileMap from "./components/profile_map"
import UpcomingTripsCalendar from "./components/UpcomingTripsCalendar"
import { ShowGeneratedItinerary } from "./components/sample_itin"
export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: allItineraries } = user
    ? await getItinerariesByUser(supabase, user.id)
    : { data: [] }

  // Split into regular trips and Atlas recommendations
  const itineraries = (allItineraries ?? []).filter(t => !t.is_recommendation)

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

  const trips = itineraries.map((trip) => {
    const members = membersByItinerary.get(trip.id) ?? []
    return {
      id: trip.id,
      title: trip.title ?? "Untitled Trip",
      location: trip.location ?? null,
      start_date: trip.start_date ?? null,
      end_date: trip.end_date ?? null,
      cover_photo_url: trip.cover_photo_url ?? null,
      updated_at: trip.updated_at ?? null,
      lat: trip.lat ?? null,
      lng: trip.lng ?? null,
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

  const calendarTrips = trips.map((t) => ({
    id: t.id,
    title: t.title,
    location: t.location ?? undefined,
    startDate: t.start_date ?? undefined,
    endDate: t.end_date ?? undefined,
    coverPhoto: t.cover_photo_url ?? undefined,
    lat: t.lat ?? undefined,
    lng: t.lng ?? undefined,
  }))

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <ProfileHeader />
        <div className="flex gap-6 items-start">

          {/* Left sidebar */}
          <div className="w-80 shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-0.5">Upcoming Trips</p>
              <p className="text-xs text-gray-400 mb-4">Your next planned adventures</p>
              <UpcomingTripsCalendar trips={calendarTrips} />
            </div>
            <ProfileMap trips={trips} />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col gap-6">
            {/* My Trips — regular trips only, no recommendations */}
            <TripHistory trips={trips} />

            {/* Agent Atlas Recommendations — separate section */}
            <ShowGeneratedItinerary />
          </div>

        </div>
      </div>
    </div>
  )
}