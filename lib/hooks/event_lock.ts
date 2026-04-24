// lib/hooks/useEventLock.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useUser';

type LockState = {
  lockedBy: string | null;
  isLockedByMe: boolean;
};

const supabase = createClient();

export function useEventLock(eventId: string) {
  const user = useUser();
  const heartbeatRef = useRef<NodeJS.Timeout>(undefined);

  const [lock, setLock] = useState<LockState>({
    lockedBy: null,
    isLockedByMe: false,
  });

  // if lock is expired or empty, give current requesting user the lock
  const acquireLock = useCallback(async () => {
    if (!user) return false;

    const { error } = await supabase.from('event_locks').upsert({
        event_id: eventId,
        locked_by: user.id,
        locked_at: new Date().toISOString(),
        expires: new Date(Date.now() + 30_000).toISOString(),
    })

    if (error) return false; // someone else holds the lock

    // keeps lock while user is still editing
    heartbeatRef.current = setInterval(async () => {
    await supabase
        .from('event_locks')
        .update({ expires: new Date(Date.now() + 30_000).toISOString() })
        .eq('event_id', eventId)
        .eq('locked_by', user.id);
    }, 15_000);
  return true;
}, [eventId, user]);


  // Release lock when user is finished editing event
  const releaseLock = useCallback(async () => {
    clearInterval(heartbeatRef.current);
    await supabase.from('event_locks')
      .delete()
      .eq('event_id', eventId)
      .eq('locked_by', user?.id);
  }, [eventId, user]);

  // Subscribe to lock changes for this event
  useEffect(() => {
    const channel = supabase
      .channel(`lock:${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_locks',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        if (payload.eventType === 'DELETE' || !payload.new) {
          setLock({ lockedBy: null, isLockedByMe: false });
        } else {
          const row = payload.new as any;
          setLock({
            lockedBy: row.locked_by,
            isLockedByMe: row.locked_by === user?.id,
          });
        }
      })
      .subscribe();

    // Fetch current lock state on mount
    supabase.from('event_locks')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLock({
            lockedBy: data.locked_by,
            isLockedByMe: data.locked_by === user?.id,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, user]);

  // Release lock if user closes tab
  useEffect(() => {
    const handleUnload = () => releaseLock();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [releaseLock]);

  return { lock, acquireLock, releaseLock };
}