import { createClient } from '@/lib/supabase/server'
import { insertItineraryMember, updateItineraryMember, deleteItineraryMember, getItineraryMembers } from '@/lib/supabase/itineraryMembers'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET function to fetch all members of an itinerary
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const itinerary_id = searchParams.get('itinerary_id')
    if (!itinerary_id) return NextResponse.json({ error: 'Itinerary ID is required.' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data, error } = await getItineraryMembers(supabase, itinerary_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ members: data }, { status: 200 })
}

// POST function to add a member to an itinerary
export async function POST(req: NextRequest) {
    const { itinerary_id, user_id, role } = await req.json()
    if (!itinerary_id || !user_id || !role) return NextResponse.json({ error: 'Itinerary ID, User ID, and role are required.' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { data, error } = await insertItineraryMember(supabase, { itinerary_id, user_id, role })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ member: data }, { status: 201 })
}

// PUT function to update a member's role
export async function PUT(req: NextRequest) {
    const { id, role } = await req.json()
    if (!id || !role) return NextResponse.json({ error: 'Member ID and role are required.' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { error } = await updateItineraryMember(supabase, id, { role })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true }, { status: 200 })
}

// DELETE function to remove a member from an itinerary
export async function DELETE(req: NextRequest) {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Member ID is required.' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { error } = await deleteItineraryMember(supabase, id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true }, { status: 200 })
}
