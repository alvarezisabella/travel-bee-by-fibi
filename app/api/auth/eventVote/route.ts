import {createClient} from '@/lib/supabase/server'
import {insertEventVote, updateEventVote, deleteEventVote} from '@/lib/supabase/eventVotes'
import {NextRequest, NextResponse} from 'next/server'
import {cookies} from 'next/headers'

// POST function to create new event vote
export async function POST(req: NextRequest){
    // Collects event vote variables from json request
    // If event_id not provided, throws error
    const { event_id, vote_type } = await req.json()
    if(!event_id) {return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 })}

    // Creates supabase client
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Checks if user is authenticated, if not throws error
    const {data: {user}, error: authError} = await supabase.auth.getUser()
    if(authError || !user) { return NextResponse.json({error: 'Unauthorized.'}, {status: 401})}

    // Looks up the event to get its itinerary_id
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('itinerary_id')
        .eq('id', event_id)
        .single()
    if(eventError || !event) { return NextResponse.json({ error: 'Event not found.' }, { status: 404 }) }

    // Looks up the itinerary_members row for this user in this itinerary
    const { data: member, error: memberError } = await supabase
        .from('itinerary_members')
        .select('id')
        .eq('itinerary_id', event.itinerary_id)
        .eq('user_id', user.id)
        .single()
    if(memberError || !member) { return NextResponse.json({ error: 'User is not a member of this itinerary.' }, { status: 403 }) }

    // Inserts row into supabase event_votes table using the member's id as user_id
    const {data, error} = await insertEventVote(supabase, { event_id, user_id: member.id, vote_type })

    // If unsuccessful, throws error
    // If successful, returns vote id and successful status
    if(error) {return NextResponse.json({error: error.message}, {status: 500})}
    return NextResponse.json({ vote: data }, { status: 201 })
}

// PUT function to update vote_type based on vote ID
export async function PUT(req: NextRequest) {
    // Gets row id and vote_type
    // if id not provided, throws error
    const { id, vote_type } = await req.json()
    if(!id) { return NextResponse.json({ error: 'ID is required.' }, { status: 400 }) }

    // creates supabase client
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Checks if user is authenticated, if not throws error
    const {data: {user}, error: authError} = await supabase.auth.getUser()
    if(authError || !user) { return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }

    // Calls updateEventVote function to update the vote_type 
    // Throws error if update fails, otherwise returns successful status
    const {error} = await updateEventVote(supabase, id, { vote_type })
    if(error) { return NextResponse.json({ error: error.message }, { status: 500 }) }
    return NextResponse.json({ success: true }, { status: 200 })
}

// DELETE function to remove vote based on provided vote ID in request body
export async function DELETE(req: NextRequest) {
    // Gets row id, if id not provided, throws error
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })

    // Creates supabase client
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Checks if user is authenticated, if not throws error
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    // Calls deleteEventVote function to delete the vote row
    const { error } = await deleteEventVote(supabase, id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true }, { status: 200 })
}
