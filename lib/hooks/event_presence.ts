// lib/hooks/useTripPresence.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useUser';

type Presence = {
  userId: string;
  name: string;
  editingEventId: string | null;
};

export function useTripPresence(tripId: string) {
  const supabase = createClient();
  const user = useUser();
  const [collaborators, setCollaborators] = useState<Presence[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`trip:${tripId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<Presence>();
        const others = Object.values(state)
          .flat()
          .filter((p) => p.userId !== user.id);
        setCollaborators(others);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            name: user.user_metadata.full_name ?? user.email,
            editingEventId: null,
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [tripId, user, supabase]);

  return { collaborators };
}