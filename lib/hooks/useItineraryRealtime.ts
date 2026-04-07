'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribes to real-time changes on the events table for a given itinerary.
 * Calls onRemoteChange whenever any event is inserted, updated, or deleted.
 */
export function useItineraryRealtime(tripId: string, onRemoteChange: () => void) {
  const supabase = createClient()
  // Use a ref so the callback is always current without re-subscribing
  const callbackRef = useRef(onRemoteChange)
  useEffect(() => {
    callbackRef.current = onRemoteChange
  })

  useEffect(() => {
    const channel = supabase
      .channel(`events:itinerary:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `itinerary_id=eq.${tripId}`,
        },
        () => {
          callbackRef.current()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId, supabase])
}
