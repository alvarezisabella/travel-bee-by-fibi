import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getItinerary } from '@/lib/supabase/itinerary'
import { getEventsByItinerary } from '@/lib/supabase/event'
import { getItineraryMembers } from '@/lib/supabase/itineraryMembers'
import TripHeader from '../components/TripHeader'
import TripList from '../components/TripCard'
import { Trip } from '../types/trips'
import { Day } from '../day'
import { Event, EventLabel, EventStatus } from '../event'

// calculates ends_at time based on start_at and duration 
function timeDiffMinutes(start: string, end: string): number{
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh*60+em)-(sh*60+sm)
}

// Main page component for itinerary, fetches trip and event data, processes it, and renders TripHeader and TripList components
export default async function ItineraryPage({params}: {params: Promise<{ tripId: string }>}){
  const {tripId} = await params

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  const [{data: itinerary, error: itinError}, {data: dbEvents}, {data: members}] = await Promise.all([
    getItinerary(supabase, tripId),
    getEventsByItinerary(supabase, tripId),
    getItineraryMembers(supabase, tripId),
  ])
  console.log("[TripPage] itinError:", itinError, "itinerary:", itinerary)

  if (itinError || !itinerary){
    return <div className="p-10 text-center text-gray-500">Trip not found.</div>
  }

  const rawEvents = dbEvents ?? []

  // Fetch the current user's votes for events in this itinerary
  const voteMap = new Map<string, { id: string; vote_type: string }>()
  if (user && rawEvents.length > 0) {
    const { data: member } = await supabase
      .from('itinerary_members')
      .select('id')
      .eq('itinerary_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (member) {
      const eventIds = rawEvents.map(ev => ev.id)
      const { data: userVotes } = await supabase
        .from('event_votes')
        .select('id, event_id, vote_type')
        .eq('user_id', member.id)
        .in('event_id', eventIds)
      for (const v of userVotes ?? []) {
        voteMap.set(v.event_id, { id: v.id, vote_type: v.vote_type })
      }
    }
  }

  // Collect all unique traveler UUIDs across all events
  const allTravelerIds = [
    ...new Set(rawEvents.flatMap(ev => (ev.travelers as string[] | null) ?? []))
  ]

  // Fetch profile names in one query
  const profileMap = new Map<string, string>()
  if (allTravelerIds.length>0){
    const {data: profiles} = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', allTravelerIds)
    for (const p of profiles ?? []){
      profileMap.set(p.id, p.name)
    }
  }

  // Sort events by day then starts_at
  rawEvents.sort((a, b) => {
    const dayDiff = (a.day ?? '').localeCompare(b.day ?? '')
    if (dayDiff !== 0) return dayDiff
    return (a.starts_at ?? '').localeCompare(b.starts_at ?? '')
  })

  // Group by day column
  const dateGroups = new Map<string, typeof rawEvents>()
  for (const ev of rawEvents){
    const key = ev.day ?? 'undated'
    const group = dateGroups.get(key) ?? []
    group.push(ev)
    dateGroups.set(key, group)
  }

  // Build Day[] with events
  let dayCounter = 1
  const days: Day[] = []

  for (const [key, eventsInGroup] of dateGroups.entries()){
    const dayId = String(dayCounter)

    const events: Event[] = eventsInGroup.map(ev => {
      const duration =
        ev.starts_at && ev.ends_at
          ? timeDiffMinutes(ev.starts_at, ev.ends_at)
          : 0

      // Maps traveler ids to names
      const travelerNames = ((ev.travelers as string[] | null) ?? [])
        .map(id => profileMap.get(id) ?? id)
        .join(', ')

      return {
        id: ev.id,
        itineraryid: ev.itinerary_id,
        dayid: dayId,
        title: ev.title,
        description: ev.description ?? '',
        status: (ev.status as EventStatus) ?? 'Pending',
        startTime: ev.starts_at ?? '',
        duration,
        location: ev.location ?? '',
        travelers: travelerNames,
        type: (ev.type as EventLabel) ?? 'Activity',
        upvotes: ev.upvote ?? 0,
        downvotes: ev.downvote ?? 0,
        hasUpvoted: voteMap.get(ev.id)?.vote_type === 'upvote',
        hasDownvoted: voteMap.get(ev.id)?.vote_type === 'downvote',
        voteId: voteMap.get(ev.id)?.id,
      }
    })

    days.push({ id: dayId, itineraryid: tripId, date: key !== 'undated' ? key : undefined, events })
    dayCounter++
  }

  const location = itinerary.location ?? ''

  // Constructs Trip object to pass to components
  const trip: Trip = {
    id: tripId,
    title: itinerary.title ?? 'Untitled Trip',
    location: location || undefined,
    startDate: itinerary.start_date ?? undefined,
    endDate: itinerary.end_date ?? undefined,
    coverImage: '',
    travelers: members ?? [],
    days,
  }

  return (
    <main className="bg-gray-100 min-h-screen p-10">
      <TripHeader trip={trip} />
      <TripList trip={trip} />
    </main>
  )
}
