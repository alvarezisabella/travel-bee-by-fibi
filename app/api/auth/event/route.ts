import {createClient} from '@/lib/supabase/server'
import {insertEvent} from '@/lib/supabase/event'
import {NextRequest, NextResponse} from 'next/server'
import {cookies} from 'next/headers'

export async function POST(req: NextRequest){
    // Collects event variables from json request
    // If title or tripid not provided, throws error
    const {itineraryid, dayid, title, description, status, startTime, duration, location, type} = await req.json()
    if(!title || !itineraryid) {return NextResponse.json({ error: 'Title and trip ID are required.' }, { status: 400 })}

    // Creates supabase client
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Checks if user is authenticated, if not throws error
    const {data: {user}, error: authError} = await supabase.auth.getUser()
    if(authError || !user) { return NextResponse.json({error: 'Unauthorized.'}, {status: 401})}

    // Inserts row into supabase event table using event variables, user id, and itinerary id
    const {data, error} = await insertEvent(supabase,{
        itinerary_id: itineraryid, title, description, status, location, type, created_by: user.id,})

    // If unsuccessful, throws error
    // If successful, returns event id and successful status
    if(error) {return NextResponse.json({error: error.message}, {status: 500})}
    return NextResponse.json({ event: data }, { status: 201 })
}
