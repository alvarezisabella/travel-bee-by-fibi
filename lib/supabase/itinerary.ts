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
    .select('id, title, start_date, end_date, location, created_by, created_at, cover_photo_url')
    .eq('id', id)
    .single()
}

// Gets all itineraries created by or joined by a user
export async function getItinerariesByUser(supabase: SupabaseClient, userId: string) {
  // Get trips created by user
  const { data: created } = await supabase
    .from('itineraries')
    .select('id, title, start_date, end_date, created_by, created_at, cover_photo_url, location')
    .eq('created_by', userId)

  // Get itinerary IDs where user is a member
  const { data: memberships } = await supabase
    .from('itinerary_members')
    .select('itinerary_id')
    .eq('user_id', userId)

  const memberItineraryIds = memberships?.map((m) => m.itinerary_id) ?? []

  // Exclude trips already fetched as creator
  const createdIds = new Set(created?.map((t) => t.id) ?? [])
  const memberOnlyIds = memberItineraryIds.filter((id) => !createdIds.has(id))

  // Fetch joined trips
  const { data: joined } = memberOnlyIds.length > 0
    ? await supabase
        .from('itineraries')
        .select('id, title, start_date, end_date, created_by, created_at, cover_photo_url, location')
        .in('id', memberOnlyIds)
    : { data: [] }

  const all = [...(created ?? []), ...(joined ?? [])]
  return { data: all, error: null }
}

// Updates itinerary row with provided fields, returns success or error
export async function updateItinerary(supabase: SupabaseClient, id: string,
  data: { 
    title?: string | null
    start_date?: string | null
    end_date?: string | null
    location?: string | null
    cover_photo_url?: string | null
  }) {
  return supabase.from('itineraries').update(data).eq('id', id)
}

// Deletes itinerary row by id, returns success or error
export async function deleteItinerary(supabase: SupabaseClient, id: string) {
  return supabase.from('itineraries').delete().eq('id', id)
}