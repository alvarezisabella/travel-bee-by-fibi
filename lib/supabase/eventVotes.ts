import { SupabaseClient } from '@supabase/supabase-js'

// Inserts a new row into the event_votes table
export async function insertEventVote(supabase: SupabaseClient, data: {user_id: string; event_id: string; vote_type: string;}) {
  return supabase.from('event_votes').insert(data).select('id').single()
}

// Retrieves a single row from the event_votes table by id
export async function getEventVote(supabase: SupabaseClient, id: string) {
  return supabase
    .from('event_votes')
    .select('id, user_id, event_id, vote_type, created_at')
    .eq('id', id)
    .single()
}

// Updates a row in the event_votes table with new vote_type
export async function updateEventVote(supabase: SupabaseClient, id: string, data: { vote_type: string }) {
  return supabase.from('event_votes').update(data).eq('id', id)
}

// Deletes a row from the event_votes table by id
export async function deleteEventVote(supabase: SupabaseClient, id: string) {
  return supabase.from('event_votes').delete().eq('id', id)
}