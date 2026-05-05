import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { ItineraryUpdate } from '@/app/itinerary/types/types';

function mapUpdate(row: any): ItineraryUpdate {
  return {
    id: row.id,
    username: row.user ?? "Unknown",
    timestamp: row.time,
    action: row.action,
    title: row.title
  };
}

export async function addItineraryUpdate(
  supabase: SupabaseClient,
  itinerary: string,
  action: string,
  title: string,
  user: string,
) {
  const { error } = await supabase.rpc('add_itinerary_update', {
    p_itinerary: itinerary,
    p_action: action,
    p_title: title,
    p_user: user,
  });
  if (error) throw error;
}

export async function getItineraryUpdates(
  itineraryId: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trip_updates')
    .select('*')
    .eq('itinerary', itineraryId)
    .order('time', { ascending: false })
    .limit(3);

  if (error) throw error;
  
  return (data ?? []).map(mapUpdate);
}