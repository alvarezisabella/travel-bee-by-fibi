// app/profile/page.tsx
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"
import ProfileHeader from "./components/ProfileHeader"
import TripHistory from "./components/TripHistory"
import ProfileMapClient from "./components/ProfileMapClient"
import UpcomingTripsCalendar from "./components/UpcomingTripsCalendar"
import { ShowGeneratedItinerary } from "./components/sample_itin"
import TripCountdown from "./components/TripCountdown"
import TravelStats from "./components/TravelStats"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rawItineraries } = user
    ? await getItinerariesByUser(supabase, user.id)
    : { data: [] }

  const itineraries = (rawItineraries ?? []).filter(
    (t: any) => !t.is_recommendation
  )

  const allItineraries = rawItineraries ?? []
  const itineraryIds = itineraries.map((t) => t.id)

  const { data: allMembers } =
    itineraryIds.length > 0
      ? await supabase
          .from("itinerary_members")
          .select("itinerary_id, user_id")
          .in("itinerary_id", itineraryIds)
      : { data: [] }

  const memberUserIds = [...new Set(allMembers?.map((m) => m.user_id) ?? [])]

  const { data: profiles } =
    memberUserIds.length > 0
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

  const calendarTrips = allItineraries.map((t: any) => ({
    id: t.id,
    title: t.title ?? "Untitled Trip",
    location: t.location ?? undefined,
    startDate: t.start_date ?? undefined,
    endDate: t.end_date ?? undefined,
    coverPhoto: t.cover_photo_url ?? undefined,
    lat: t.lat ?? undefined,
    lng: t.lng ?? undefined,
  }))

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
        <ProfileHeader />

        <div className="flex w-full flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start">
          {/* Sidebar */}
          <aside className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <p className="mb-0.5 text-sm font-semibold text-gray-800">
                Upcoming Trips
              </p>
              <p className="mb-4 text-xs text-gray-400">
                Your next planned adventures
              </p>
              <UpcomingTripsCalendar trips={calendarTrips} />
            </div>

            <div className="flex min-h-[170px] flex-col justify-center rounded-2xl bg-white p-4 shadow-sm sm:min-h-[200px] sm:p-5">
              <p className="mb-0.5 text-sm font-semibold text-gray-800">
                Next Departure
              </p>
              <p className="mb-3 text-xs text-gray-400">
                Counting down to your next trip
              </p>
              <TripCountdown trips={itineraries ?? []} />
            </div>

            <div className="flex min-h-[160px] flex-col justify-center rounded-2xl bg-white p-4 shadow-sm sm:min-h-[180px] sm:p-5">
              <p className="mb-0.5 text-sm font-semibold text-gray-800">
                Travel Stats
              </p>
              <p className="mb-3 text-xs text-gray-400">
                Your journey by the numbers
              </p>
              <TravelStats
                trips={allItineraries}
                collaboratorCount={
                  allMembers
                    ? Math.max(new Set(allMembers.map((m) => m.user_id)).size - 1, 0)
                    : 0
                }
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6">
            <TripHistory trips={trips} />
            <ShowGeneratedItinerary />
            <ProfileMapClient trips={trips} />
          </main>
        </div>
      </div>
    </div>
  )
}