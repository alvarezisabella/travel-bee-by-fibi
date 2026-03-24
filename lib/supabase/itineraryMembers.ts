import { SupabaseClient } from '@supabase/supabase-js'

// Inserts row into itinerary_members table, and returns the new row's id
// For adding users to an itinerary, and assigning them a role (e.g. editor, viewer)
export async function insertItineraryMember(supabase: SupabaseClient,
  data: { itinerary_id: string; user_id: string; role: string }
) {
  return supabase.from('itinerary_members').insert(data).select('id').single()
}

// Edits role of an itinerary member based on provided member ID 
export async function updateItineraryMember(supabase: SupabaseClient, id: string,
  data: { role: string }
) {
  return supabase.from('itinerary_members').update(data).eq('id', id)
}

// Deletes a row from itinerary_members table based on provided member ID
// For removing a user from an itinerary
export async function deleteItineraryMember(supabase: SupabaseClient, id: string) {
  return supabase.from('itinerary_members').delete().eq('id', id)
}

// Fetch itinerary members with their names and roles
export async function getItineraryMembers(supabase: SupabaseClient, itineraryId: string){
  // Selects user_id and role from itinerary_members table where itinerary_id matches the provided id
  // If no members found or error occurs, returns empty array and error
  const { data: members, error } = await supabase
    .from('itinerary_members')
    .select('id, user_id, role')
    .eq('itinerary_id', itineraryId)
    
  if (error || !members || members.length === 0) {
    return { data: [], error }
  }

  // Makes array of user ids from the members data
  const userIds = members.map((m) => m.user_id) 

  // Selects id and name from profiles table of all userIDs
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds)

  // For each member, maps their user_id to their name from the profiles table
  const profileMap = new Map<string, string>()
  for (const p of profiles ?? []) {
    profileMap.set(p.id, p.name)
  }

  // Maps the members data to an array of objects containing id, name, and role for each member
  // and returns it
  const data = members.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    name: profileMap.get(m.user_id) ?? m.user_id,
    role: m.role as string,
  }))

  return { data, error: null }
}
