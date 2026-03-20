import { SupabaseClient } from '@supabase/supabase-js'

// Fetch itinerary members with their names and roles
export async function getItineraryMembers(supabase: SupabaseClient, itineraryId: string){
  // Selects user_id and role from itinerary_members table where itinerary_id matches the provided id
  // If no members found or error occurs, returns empty array and error
  const { data: members, error } = await supabase
    .from('itinerary_members')
    .select('user_id, role')
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
    id: m.user_id,
    name: profileMap.get(m.user_id) ?? m.user_id,
    role: m.role as string,
  }))

  return { data, error: null }
}
