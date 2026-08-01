import {createClient} from '@/lib/supabase/server'
import {insertEvent, updateEvent, deleteEvent} from '@/lib/supabase/event'
import {NextRequest, NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import { getUserNameById } from '@/lib/hooks/getUser'
import { addItineraryUpdate } from '@/lib/hooks/updates'

export async function POST(req: NextRequest){
    // Collects event variables from json request
    // If title or tripid not provided, throws error
    const {itineraryid, title, description, status, startTime, duration, day, location, type, travelers, lat, lng} = await req.json()
    if(!title || !itineraryid || !day) {return NextResponse.json({ error: 'Title, trip ID, and day are required.' }, { status: 400 })}

    // Creates supabase client
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Checks if user is authenticated, if not throws error
    const {data: {user}, error: authError} = await supabase.auth.getUser()
    if(authError || !user) { return NextResponse.json({error: 'Unauthorized.'}, {status: 401})}

    const ends_at = startTime && duration
      ? (() => { const [h, m] = startTime.split(':').map(Number); const total = h * 60 + m + Number(duration); return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` })()
      : undefined
    const updated_by = await getUserNameById(user.id) || undefined

    // Inserts row into supabase event table using event variables, user id, and itinerary id
    const {data, error} = await insertEvent(supabase,{
        itinerary_id: itineraryid, title, description, status, starts_at: startTime || undefined, ends_at, day: day || undefined, location, type, travelers: travelers?.length ? travelers : undefined, created_by: user.id, lat, lng, updated_by})

    // If unsuccessful, throws error
    // If successful, returns event id and successful status
    if(error) {return NextResponse.json({error: error.message}, {status: 500})}

    await addItineraryUpdate(supabase, itineraryid, 'Added', title, updated_by ?? 'Unknown');

    return NextResponse.json({ event: data }, { status: 201 })
}

// PUT function to update event details based on event ID and provided fields in request body
export async function PUT(req: NextRequest) {
    const { itineraryid, id, title, description, status, startTime, duration, location, type, travelers, lat, lng} = await req.json()
    if(!id || !title) { return NextResponse.json({ error: 'ID and title are required.' }, { status: 400 }) }

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const {data: {user}, error: authError} = await supabase.auth.getUser()
    if(authError || !user) { return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }

    const updated_by = await getUserNameById(user.id) || undefined
    const ends_at = startTime && duration
      ? (() => { const [h, m] = startTime.split(':').map(Number); const total = h * 60 + m + Number(duration); return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` })()
      : undefined

    const {error} = await updateEvent(supabase, id, { title, description, status, starts_at: startTime || undefined, ends_at, location, type, travelers: travelers ?? [], lat, lng, updated_by})
    if(error) { return NextResponse.json({ error: error.message }, { status: 500 }) }

    await addItineraryUpdate(supabase, itineraryid, 'Edited', title, updated_by ?? 'Unknown');
    return NextResponse.json({ success: true }, { status: 200 })
}

// DELETE function to remove event based on provided event ID in request body
export async function DELETE(req: NextRequest) {
    const { itineraryid, id, title } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    // Safety check — this route only deletes a single event, never a whole itinerary
    const { data: event } = await supabase
      .from('events') //itinerary_activities
      .select('id')
      .eq('id', id)
      .single()

    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })

    const { error } = await deleteEvent(supabase, id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const updated_by = await getUserNameById(user.id) || undefined
    await addItineraryUpdate(supabase, itineraryid, 'Removed', title, updated_by ?? 'Unknown')
    return NextResponse.json({ success: true }, { status: 200 })
}