import { SupabaseClient } from '@supabase/supabase-js'

export async function insertEvent(supabase: SupabaseClient,
  data: { itinerary_id: string; title: string; description?: string
    starts_at?: string; ends_at?: string; day?: string
    location?: string; cost?: number; booking_code?: string
    type?: string; status?: string; travelers?: string[]; created_by: string}
) {
  return supabase.from('events').insert(data).select('id').single()
}

export async function getEvent(supabase: SupabaseClient, id: string) {
  return supabase
    .from('events')
    .select('id, itinerary_id, title, description, starts_at, ends_at, num_guests, location, cost, booking_code, type, status, created_by, created_at, updated_at')
    .eq('id', id)
    .single()
}

export async function getEventsByItinerary(supabase: SupabaseClient, itineraryId: string) {
  return supabase
    .from('events')
    .select('id, itinerary_id, title, description, starts_at, ends_at, location, cost, booking_code, type, status, day, upvote, downvote, guests_count, travelers, created_by, created_at, updated_at')
    .eq('itinerary_id', itineraryId)
}

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  data: {title?: string; description?: string; starts_at?: string; ends_at?: string
    num_guests?: number; location?: string; cost?: number
    booking_code?: string; type?: string; status?: string; travelers?: string[]
  }
) {
  return supabase.from('events').update(data).eq('id', id)
}

export async function deleteEvent(supabase: SupabaseClient, id: string) {
  return supabase.from('events').delete().eq('id', id)
}
