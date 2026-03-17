import { SupabaseClient } from '@supabase/supabase-js'

export async function insertItinerary(supabase: SupabaseClient,
  data: { title?: string | null; start_date?: string; end_date?: string; location?: string; created_by: string }
) {
  return supabase.from('itineraries').insert(data).select('id').single()
}

export async function getItinerary(supabase: SupabaseClient, id: string) {
  return supabase
    .from('itineraries')
    .select('id, title, start_date, end_date, location, created_by, created_at')
    .eq('id', id)
    .single()
}

export async function getItinerariesByUser(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('itineraries')
    .select('id, title, start_date, end_date, created_by, created_at')
    .eq('created_by', userId)
}

export async function updateItinerary(
  supabase: SupabaseClient,
  id: string,
  data: { title?: string; start_date?: string; end_date?: string; location?: string }
) {
  return supabase.from('itineraries').update(data).eq('id', id)
}

export async function deleteItinerary(supabase: SupabaseClient, id: string) {
  return supabase.from('itineraries').delete().eq('id', id)
}
