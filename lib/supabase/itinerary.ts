import { SupabaseClient } from '@supabase/supabase-js'

export async function insertItinerary(supabase: SupabaseClient,
  data: { title?: string | null; start_date?: string; end_date?: string; location?: string; created_by: string }) {
  return supabase.from('itineraries').insert(data).select('id').single()
}

export async function getItinerary(supabase: SupabaseClient, id: string) {
  return supabase
    .from('itineraries')
    .select('id, title, start_date, end_date, location, created_by, created_at, cover_photo_url, cover_photo_position, lat, lng')
    .eq('id', id)
    .single()
}

export async function getItinerariesByUser(supabase: SupabaseClient, userId: string) {
  const { data: created } = await supabase
    .from('itineraries')
    .select('id, title, start_date, end_date, created_by, created_at, cover_photo_url, cover_photo_position, location, lat, lng')
    .eq('created_by', userId)

  const { data: memberships } = await supabase
    .from('itinerary_members')
    .select('itinerary_id')
    .eq('user_id', userId)

  const memberItineraryIds = memberships?.map((m) => m.itinerary_id) ?? []
  const createdIds = new Set(created?.map((t) => t.id) ?? [])
  const memberOnlyIds = memberItineraryIds.filter((id) => !createdIds.has(id))

  const { data: joined } = memberOnlyIds.length > 0
    ? await supabase
        .from('itineraries')
        .select('id, title, start_date, end_date, created_by, created_at, cover_photo_url, cover_photo_position, location, lat, lng')
        .in('id', memberOnlyIds)
    : { data: [] }

  const all = [...(created ?? []), ...(joined ?? [])]
  return { data: all, error: null }
}

export async function updateItinerary(supabase: SupabaseClient, id: string,
  data: {
    title?: string | null
    start_date?: string | null
    end_date?: string | null
    location?: string | null
    cover_photo_url?: string | null
    cover_photo_position?: number | null
    lat?: number | null
    lng?: number | null
  }) {
  return supabase.from('itineraries').update(data).eq('id', id)
}

export async function deleteItinerary(supabase: SupabaseClient, id: string) {
  return supabase.from('itineraries').delete().eq('id', id)
}