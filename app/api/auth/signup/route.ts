import { createClient } from '@/lib/supabase/server'
import { insertProfile } from '@/lib/supabase/profile'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, password, username } = await req.json()

  if (!email || !password || !username) {
    return NextResponse.json({ error: 'Email, password, and username are required.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'Signup failed.' }, { status: 400 })
  }

  await insertProfile(supabase, data.user.id, username)

  return NextResponse.json({ user: data.user }, { status: 201 })
}
