import { createClient } from '@/lib/supabase/server'
import { insertItinerary, updateItinerary } from '@/lib/supabase/itinerary'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

    // Inserts row into supabase itinerary table using user id
    const {data, error} = await insertItinerary(supabase, {created_by: user.id})
    if(error) {return NextResponse.json({error: error.message}, {status: 500})}

    return NextResponse.json({itinerary: data}, {status: 201})
}

// PUT to update itinerary fields
export async function PUT(req: NextRequest) {
    // Collects itinerary variables from json response
    // If id not provided, throws error
    const { id, title, start_date, end_date, location, cover_photo_url } = await req.json()
    if (!id) { return NextResponse.json({ error: 'Itinerary ID is required.' }, { status: 400 }) }

    // Creates supabase client
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Gets uuid of the user updating the itinerary for created_by field
    // Throws error if not authneticated or user doesn't exist
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) { return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }

    // Updates itinerary row
    const { error } = await updateItinerary(supabase, id, { title, start_date, end_date, location, cover_photo_url })
    if (error) { return NextResponse.json({ error: error.message }, { status: 500 }) }

    return NextResponse.json({ success: true }, { status: 200 })
}