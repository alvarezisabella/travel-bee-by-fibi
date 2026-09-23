import { createClient } from '@/lib/supabase/client';

export async function getUserName() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let username: string | null = null;
  if(user){
    username = await getUserNameById(user.id)
  }
  return username
}

export async function getUserNameById(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();

  if (!profile) return null;
  const first = profile.first_name ?? '';
  const last = profile.last_name ?? '';
  return [first, last].filter(Boolean).join(' ') || "Another member" || null;
}