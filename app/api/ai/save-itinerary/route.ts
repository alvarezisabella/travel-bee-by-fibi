import { createClient } from "@/lib/supabase/server"
import { insertItinerary } from "@/lib/supabase/itinerary"
import { insertEvent } from "@/lib/supabase/event"
import { insertItineraryMember } from "@/lib/supabase/itineraryMembers"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { GeneratedItinerary } from "@/app/api/ai/generate-itinerary/route"

// ─── Helper ───────────────────────────────────────────────────────────────────

// Computes the end time from a start time and duration in minutes.
// Mirrors the exact formula in /app/api/auth/event/route.ts so the
// ends_at field is calculated consistently across the entire app.
function computeEndsAt(startTime: string, duration: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + duration
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ─── Route Handler ────────────────────────────────────────────────────────────

// POST /api/ai/save-itinerary
// Takes the generated itinerary that the user reviewed on /ai-template and
// persists it to Supabase: creates the itinerary row, adds the user as owner,
// and bulk-inserts all events. Only called when the user explicitly clicks Save.
export async function POST(req: NextRequest) {
  // Creates a Supabase client using the current request cookies
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Checks authentication — the save action must be tied to a real user account
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Reads the itinerary JSON (already generated and reviewed by the user) plus
  // the trip metadata that was collected from the landing page form
  const { itinerary, location, startDate, endDate }: {
    itinerary: GeneratedItinerary
    location: string
    startDate: string
    endDate: string
  } = await req.json()

  // All four fields are required — itinerary provides the events, the rest
  // fills in the itinerary row metadata
  if (!itinerary || !location || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'itinerary, location, startDate, and endDate are required.' },
      { status: 400 }
    )
  }

  // Creates the itinerary row using the AI-generated title and the form metadata.
  // This is the first DB write — nothing is saved before the user clicks Save.
  const { data: itineraryData, error: itinError } = await insertItinerary(supabase, {
    title: itinerary.title,
    start_date: startDate,
    end_date: endDate,
    location,
    created_by: user.id,
  })

  if (itinError || !itineraryData) {
    return NextResponse.json(
      { error: itinError?.message ?? 'Failed to create itinerary.' },
      { status: 500 }
    )
  }

  const itineraryId = itineraryData.id

  // Adds the creator as the owner member so they have full permissions on the trip.
  // The existing itinerary list query (getItinerariesByUser) picks up trips via
  // created_by, but itinerary_members is needed for role-based UI logic in TripHeader.
  await insertItineraryMember(supabase, {
    itinerary_id: itineraryId,
    user_id: user.id,
    role: 'owner',
  })

  // Inserts all events in parallel for efficiency. Each event's ends_at is
  // computed from startTime + duration using the same formula as the event route.
  // We intentionally do NOT pass travelers — at generation time there are no
  // user UUIDs to assign; travelers can be invited later from the itinerary page.
  const eventInserts = itinerary.days.flatMap(day =>
    day.events.map(ev =>
      insertEvent(supabase, {
        itinerary_id: itineraryId,
        title: ev.title,
        description: ev.description,
        starts_at: ev.startTime || undefined,
        ends_at: ev.startTime && ev.duration ? computeEndsAt(ev.startTime, ev.duration) : undefined,
        day: day.date,
        location: ev.location,
        type: ev.type,
        status: ev.status,
        created_by: user.id,
      })
    )
  )

  // Supabase calls return { data, error } rather than throwing, so Promise.all
  // resolves even when individual inserts fail. Check each result and surface
  // any failures — without this, events silently drop and the user lands on an
  // itinerary page that is missing activities with no explanation.
  const results = await Promise.all(eventInserts)
  const failedInserts = results.filter(r => r.error)
  if (failedInserts.length > 0) {
    console.error(`[save-itinerary] ${failedInserts.length} event(s) failed to insert:`,
      failedInserts.map(r => r.error?.message))
    return NextResponse.json(
      { error: 'Some events could not be saved. Please try again.' },
      { status: 500 }
    )
  }

  // Returns the new itinerary ID so the client can redirect to /itinerary/[id]
  return NextResponse.json({ itineraryId }, { status: 201 })
}
