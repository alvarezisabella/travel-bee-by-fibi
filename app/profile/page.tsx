import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"
import ProfileHeader from "./components/ProfileHeader"
import TripHistory from "./components/TripHistory"

function UpcomingCalendar() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-800">Upcoming Trips</p>
      <p className="text-xs text-gray-400 -mt-1">Your next planned adventures</p>
      <div className="w-full h-64 bg-gray-100 rounded-xl mt-2" />
    </div>
  )
}

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: itineraries } = user
    ? await getItinerariesByUser(supabase, user.id)
    : { data: [] }

  const itineraryIds = itineraries?.map((t) => t.id) ?? []

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

  const trips = (itineraries ?? []).map((trip) => {
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

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <ProfileHeader />
        <div className="flex gap-6 items-start">
          <div className="w-80 shrink-0">
            <UpcomingCalendar />
          </div>
          <div className="flex-1">
            <TripHistory trips={trips} />
          </div>
        </div>
      </div>
    </div>
  )
}