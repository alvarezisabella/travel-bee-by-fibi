import { createClient } from '@/lib/supabase/server'
import { insertProfile, getProfile, updateProfile, deleteProfile } from '@/lib/supabase/profile'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'testuser@example.com',
    password: 'testpassword123'
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' })
  }

  const testId = authData.user.id

  const insert = await insertProfile(supabase, testId, 'Test User')
  const get = await getProfile(supabase, testId)
  const update = await updateProfile(supabase, testId, 'Updated Name')
  const del = await deleteProfile(supabase, testId)

  return NextResponse.json({ userId: testId, insert, get, update, del })
}
