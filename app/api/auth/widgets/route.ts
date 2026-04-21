import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const itineraryId = request.nextUrl.searchParams.get('itinerary_id')

  let query = supabase.from("event_widgets").select("*")
  if (itineraryId) query = query.eq('itinerary_id', itineraryId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('event_widgets')
    .insert({
      itinerary_id: body.itinerary_id,
      title: body.title,
      description: body.description ?? null,
      location: body.location ?? null,
      image_url: body.image_url ?? null,
      type: body.type,
      rating: body.rating ?? null,
      price: body.price ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // return the row directly so json.id works in EventWidget
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { error } = await supabase
    .from('event_widgets')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}