import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getItinerary } from '@/lib/supabase/itinerary'
import { getEventsByItinerary } from '@/lib/supabase/event'
import { getItineraryMembers } from '@/lib/supabase/itineraryMembers'
import TripHeader from '../components/TripHeader'
import TripList from '../components/TripCard'
import { Trip } from '../types/types'
import { Day } from '../day'
import { Event, EventLabel, EventStatus } from '../types/types'

function timeDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export default async function ItineraryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: itinerary, error: itinError }, { data: dbEvents }, { data: members }] = await Promise.all([
    getItinerary(supabase, tripId),
    getEventsByItinerary(supabase, tripId),
    getItineraryMembers(supabase, tripId),
  ])
  console.log("[TripPage] itinError:", itinError, "itinerary:", itinerary)

  if (itinError || !itinerary) {
    return <div className="p-10 text-center text-gray-500">Trip not found.</div>
  }

  const rawEvents = dbEvents ?? []

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

  const allTravelerIds = [
    ...new Set(rawEvents.flatMap(ev => (ev.travelers as string[] | null) ?? []))
  ]

  const profileMap = new Map<string, string>()
  if (allTravelerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', allTravelerIds)
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.username)
    }
  }

  rawEvents.sort((a, b) => {
    const dayDiff = (a.day ?? '').localeCompare(b.day ?? '')
    if (dayDiff !== 0) return dayDiff
    return (a.starts_at ?? '').localeCompare(b.starts_at ?? '')
  })

  const dateGroups = new Map<string, typeof rawEvents>()
  for (const ev of rawEvents) {
    const key = ev.day ?? 'undated'
    const group = dateGroups.get(key) ?? []
    group.push(ev)
    dateGroups.set(key, group)
  }

  const mapEvent = (ev: typeof rawEvents[0], dayId: string): Event => {
    const duration = ev.starts_at && ev.ends_at ? timeDiffMinutes(ev.starts_at, ev.ends_at) : 0
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
      lat: ev.lat,
      lng: ev.lng
    }
  }

  const days: Day[] = []

  if (itinerary.start_date && itinerary.end_date) {
    let current = new Date(itinerary.start_date)
    const end = new Date(itinerary.end_date)
    let dayCounter = 1

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const dayId = String(dayCounter)
      const events = (dateGroups.get(dateStr) ?? []).map(ev => mapEvent(ev, dayId))
      days.push({ id: dayId, itineraryid: tripId, date: dateStr, events })
      dateGroups.delete(dateStr)
      current = new Date(current.getTime() + 86400000)
      dayCounter++
    }
  } else {
    let dayCounter = 1
    for (const [key, eventsInGroup] of dateGroups.entries()) {
      const dayId = String(dayCounter)
      const events = eventsInGroup.map(ev => mapEvent(ev, dayId))
      days.push({ id: dayId, itineraryid: tripId, date: key !== 'undated' ? key : undefined, events })
      dayCounter++
    }
  }

  const location = itinerary.location ?? ''

  const trip: Trip = {
    id: tripId,
    title: itinerary.title ?? 'Untitled Trip',
    location: location || undefined,
    startDate: itinerary.start_date ?? undefined,
    endDate: itinerary.end_date ?? undefined,
    coverImage: '',
    cover_photo_url: itinerary.cover_photo_url ?? null,
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