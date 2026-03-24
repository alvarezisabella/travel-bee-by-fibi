import { SupabaseClient } from '@supabase/supabase-js'

// Inserts row into itinerary table and returns the new itinerary id
export async function insertItinerary(supabase: SupabaseClient,
  data: { title?: string | null; start_date?: string; end_date?: string; location?: string; created_by: string }) 
  {
  return supabase.from('itineraries').insert(data).select('id').single()
}

// Gets itinerary by id, returns single itinerary object
export async function getItinerary(supabase: SupabaseClient, id: string) {
  return supabase
    .from('itineraries')
    .select('id, title, start_date, end_date, location, created_by, created_at')
    .eq('id', id)
    .single()
}

// Gets all itineraries created by a user, returns array of itinerary objects
export async function getItinerariesByUser(supabase: SupabaseClient, userId: string) {
  return supabase.from('itineraries').select('id, title, start_date, end_date, created_by, created_at').eq('created_by', userId)
}

// Updates itinerary row with provided fields, returns success or error
export async function updateItinerary(supabase: SupabaseClient, id: string,
  data: { title?: string; start_date?: string; end_date?: string; location?: string }) {
  return supabase.from('itineraries').update(data).eq('id', id)
}

// Deletes itinerary row by id, returns success or error
export async function deleteItinerary(supabase: SupabaseClient, id: string) {
  return supabase.from('itineraries').delete().eq('id', id)
}
