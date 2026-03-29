import { SupabaseClient } from '@supabase/supabase-js'
import {createAdminClient} from '@/lib/supabase/admin'

export async function insertProfile(supabase: SupabaseClient, id: string, username: string, firstName: string, lastName: string) {
  return supabase.from('profiles').insert({ id, username, firstName, lastName })
}

export async function getProfile(supabase: SupabaseClient, id: string) {
  return supabase.from('profiles').select('id, username, firstName, lastName, created_at').eq('id', id).single()
}

export async function updateProfile(supabase: SupabaseClient, id: string, username: string, firstName: string, lastName: string) {
  return supabase.from('profiles').update({ username, firstName, lastName }).eq('id', id)
}

export async function deleteProfile(supabase: SupabaseClient, id: string) {
  const adminClient = createAdminClient()
  return adminClient.auth.admin.deleteUser(id)  
}
