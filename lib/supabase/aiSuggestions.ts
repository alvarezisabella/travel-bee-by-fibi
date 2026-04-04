import { SupabaseClient } from '@supabase/supabase-js'

// Function to save suggestions to the database
// Arguments: supabase client, itinerary ID, user who saved the suggestion, content of the suggestion, and an optional message ID
export async function saveSuggestion(supabase: SupabaseClient, itineraryId: string, savedBy: string, content: string, messageId?: string) {
  return supabase
    .from('ai_suggestions')
    .insert({itinerary_id: itineraryId, saved_by: savedBy, content, message_id: messageId ?? null,})
    .select('id')
    .single()
}

// Function to get suggestions for a specific itinerary, ordered by creation date in descending order
// Arguments: supabase client and itinerary ID
export async function getSuggestions(supabase: SupabaseClient, itineraryId: string) {
  return supabase
    .from('ai_suggestions')
    .select('id, content, saved_by, created_at')
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: false })
}

// Function to delete a suggestion by its ID
// Arguments: supabase client and suggestion ID
export async function deleteSuggestion(supabase: SupabaseClient, id: string) {
  return supabase.from('ai_suggestions').delete().eq('id', id)
}
