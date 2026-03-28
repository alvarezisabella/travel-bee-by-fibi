import { createClient } from '@/lib/supabase/server'
import { insertProfile } from '@/lib/supabase/profile'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  // Collects profile variables from json request
  // If email, password, username not all provided, throws error
  const { email, password, username, firstName, lastName } = await req.json()
  if (!email || !password || !username || !firstName || !lastName) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  // Creates supabase client
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Enters row into supabase authentication table using email and password
  // auth.signUp generates uuid
  // If unsuccessful, throws error
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'Signup failed.' }, { status: 400 })
  }

  // Inserts row into supabase profile table using user id and username
  await insertProfile(supabase, data.user.id, username, firstName, lastName)

  // Returns successful status if signup is good
  return NextResponse.json({ user: data.user }, { status: 201 })
}
