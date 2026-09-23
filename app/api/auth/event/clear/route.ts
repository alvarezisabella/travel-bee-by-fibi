import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE(req: NextRequest) {
  const { itinerary_id } = await req.json()
  if (!itinerary_id) return NextResponse.json({ error: 'Missing itinerary_id' }, { status: 400 })

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('itinerary_id', itinerary_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}