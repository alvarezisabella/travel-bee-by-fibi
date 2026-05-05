import { SupabaseClient } from '@supabase/supabase-js';

export async function addItineraryUpdate(
  supabase: SupabaseClient,
  itinerary: string,
  update: string,
  user: string,
) {
  const { error } = await supabase.rpc('add_itinerary_update', {
    p_itinerary: itinerary,
    p_update: update,
    p_user: user,
  });
console.log("update: ", update)
  if (error) throw error;
}

export async function getItineraryUpdates(
  supabase: SupabaseClient,
  itineraryId: string,
) {
  const { data, error } = await supabase
    .from('trip_updates')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .order('time', { ascending: false })
    .limit(3);

  if (error) throw error;
  return data;
}