import { createClient } from '@/lib/supabase/server'
import { insertItinerary, updateItinerary, getItinerary } from '@/lib/supabase/itinerary'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Trims a string field, treating blanks and non-strings as null
function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

// Returns a finite number or null
function cleanNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Itinerary ID is required.' }, { status: 400 })

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { data: itinerary, error: itinError } = await getItinerary(supabase, id)
  if (itinError || !itinerary) {
    return NextResponse.json({ error: itinError?.message ?? 'Itinerary not found.' }, { status: 404 })
  }

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('itinerary_id', id)

  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 })

  // Days are derived from the date range, same as handleAddDay's id scheme (sequential index)
  const days: { id: string; itineraryid: string; date?: string; events: typeof events }[] = []

  if (itinerary.start_date && itinerary.end_date) {
    let index = 1
    for (
      let d = new Date(itinerary.start_date);
      d <= new Date(itinerary.end_date);
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        id: String(index),
        itineraryid: id,
        date: dateStr,
        events: (events ?? []).filter(e => e.day === dateStr),
      })
      index++
    }
  }

  return NextResponse.json({ ...itinerary, days })
}

// POST to insert new itinerary row
export async function POST(req: NextRequest){
    // // Collects itinerary variables from json response
    // // If title not provided, throws error
    // const { title, description, start_date, end_date, city, state, country } = await req.json()
    // if(!title) {return NextResponse.json({error: 'Title is required.'}, {status: 400})}

    // Creates supabase client 
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Gets uuid of the user creating the itinerary
    // If user id doesn't exist, throws error
    const {data: {user}, error: authError} = await supabase.auth.getUser()
    if(authError || !user) {return NextResponse.json({error: 'Unauthorized.'}, {status: 401})}

    // Optional trip details from the Trip Details popup (empty body when skipped)
    const body = await req.json().catch(() => ({}))
    const start_date = cleanText(body.start_date)
    const end_date = cleanText(body.end_date)
    if (start_date && end_date && end_date < start_date) {
        return NextResponse.json({ error: 'End date cannot be before start date.' }, { status: 400 })
    }

    let num_travelers: number | null = null
    const travelersNum = Number(body.num_travelers)
    if (body.num_travelers != null && Number.isFinite(travelersNum)) {
        num_travelers = Math.min(50, Math.max(1, Math.round(travelersNum)))
    }

    // Inserts row into supabase itinerary table using user id
    const {data, error} = await insertItinerary(supabase, {
        created_by: user.id,
        title: cleanText(body.title),
        start_date,
        end_date,
        location: cleanText(body.location),
        lat: cleanNumber(body.lat),
        lng: cleanNumber(body.lng),
        num_travelers,
        travel_mood: cleanText(body.travel_mood),
        stay_location: cleanText(body.stay_location),
        stay_lat: cleanNumber(body.stay_lat),
        stay_lng: cleanNumber(body.stay_lng),
    })
    if(error) {return NextResponse.json({error: error.message}, {status: 500})}

    return NextResponse.json({itinerary: data}, {status: 201})
}

// PUT to update itinerary fields
export async function PUT(req: NextRequest) {
    const {
        id, title, start_date, end_date, location, lat, lng, cover_photo_url, confirm_date_shift,
        stay_location, stay_lat, stay_lng, travel_mood, num_travelers,
    } = await req.json()
    if (!id) { return NextResponse.json({ error: 'Itinerary ID is required.' }, { status: 400 }) }

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) { return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }

    // Handles date changes that may affect existing events
    if (start_date !== undefined || end_date !== undefined) {
        const { data: current, error: fetchError } = await getItinerary(supabase, id)
        if (fetchError || !current) {
            return NextResponse.json({ error: 'Itinerary not found.' }, { status: 404 })
        }

        const oldStart: string | null = current.start_date
        const oldEnd: string | null = current.end_date
        const newStart: string | null = start_date ?? oldStart
        const newEnd: string | null = end_date ?? oldEnd

        if (newStart && newEnd && oldStart && oldEnd) {
            // Checks that new end is not before new start
            if (newEnd < newStart) {
                return NextResponse.json({ error: 'End date cannot be before start date.' }, { status: 400 })
            }

            // Start pushed forward — requires user confirmation to shift all events
            if (newStart > oldStart && !confirm_date_shift) {
                const oldDurationMs = new Date(oldEnd).getTime() - new Date(oldStart).getTime()
                const suggestedEnd = new Date(new Date(newStart).getTime() + oldDurationMs)
                    .toISOString().split('T')[0]
                return NextResponse.json({ code: 'START_FORWARD', suggested_end: suggestedEnd }, { status: 409 })
            }

            // Start pushed forward (confirmed) — shift all events forward by delta
            if (newStart > oldStart && confirm_date_shift) {
                const deltaMs = new Date(newStart).getTime() - new Date(oldStart).getTime()
                const { data: events } = await supabase
                    .from('events').select('id, day').eq('itinerary_id', id).not('day', 'is', null)
                if (events && events.length > 0) {
                    await Promise.all(events.map(ev => {
                        const shifted = new Date(new Date(ev.day!).getTime() + deltaMs).toISOString().split('T')[0]
                        return supabase.from('events').update({ day: shifted }).eq('id', ev.id)
                    }))
                }
            }

            // End pushed back
            // Blocked if events would be cut off
            if (newEnd < oldEnd) {
                const { data: cutEvents } = await supabase
                    .from('events').select('id').eq('itinerary_id', id).gt('day', newEnd).lte('day', oldEnd)
                if (cutEvents && cutEvents.length > 0) {
                    return NextResponse.json({
                        code: 'EVENTS_ON_CUT_DAYS',
                        error: 'Cannot shorten the trip — some days being removed still have events.',
                    }, { status: 409 })
                }
            }

            // Start pushed back 
            // Shifts all events earlier 
            if (newStart < oldStart) {
                const deltaMs = new Date(newStart).getTime() - new Date(oldStart).getTime()
                const { data: events } = await supabase
                    .from('events').select('id, day').eq('itinerary_id', id).not('day', 'is', null)
                if (events && events.length > 0) {
                    await Promise.all(events.map(ev => {
                        const shifted = new Date(new Date(ev.day!).getTime() + deltaMs).toISOString().split('T')[0]
                        return supabase.from('events').update({ day: shifted }).eq('id', ev.id)
                    }))
                }
            }
        }
    }

    const { error } = await updateItinerary(supabase, id, {
        title, start_date, end_date, location, lat, lng, cover_photo_url,
        stay_location, stay_lat, stay_lng, travel_mood, num_travelers,
    })
    if (error) { return NextResponse.json({ error: error.message }, { status: 500 }) }

    return NextResponse.json({ success: true }, { status: 200 })
}