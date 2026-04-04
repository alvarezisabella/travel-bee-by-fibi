import { SupabaseClient } from '@supabase/supabase-js'

// Function to get/create a chat session for a user and itinerary
// Arguments: supabase client, user ID, itinerary ID
// Returns: session ID
export async function getOrCreateSession(supabase: SupabaseClient, userId: string, itineraryId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('itinerary_id', itineraryId)
    .single()
  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, itinerary_id: itineraryId })
    .select('id')
    .single()

  // If fails for any reason, throws an error
  if (error || !created) throw new Error('Failed to create chat session')
  return created.id
}

// Function to save a message to the database
// Arguments: supabase client, session ID, role ('user' or 'assistant'), message content
// Returns: message ID
export async function saveMessage(supabase: SupabaseClient, sessionId: string, role: 'user' | 'assistant', content: string): Promise<string> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content })
    .select('id')
    .single()

  // If fails for any reason, throws an error
  if (error || !data) throw new Error('Failed to save message')
  return data.id
}

// Function to load all messages for a session in chronological order
// Arguments: supabase client, session ID
// Returns: Array of message objects
export async function getSessionMessages(supabase: SupabaseClient, sessionId: string): 
  Promise<Array<{ id: string; role: string; content: string; created_at: string }>> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  // If fails for any reason, throws an error
  if (error) throw new Error('Failed to load chat messages')
  return data ?? []
}
