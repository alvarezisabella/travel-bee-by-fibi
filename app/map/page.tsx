"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Event } from "@/app/itinerary/types/types"

const CaliforniaMap = dynamic(() => import("./map_view"), { ssr: false })

function MapContent() {
  const params = useSearchParams()
  const tripId = params.get("tripId")
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    if (!tripId) return
    const fetchEvents = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("itinerary_id", tripId)
      setEvents(data ?? [])
    }
    fetchEvents()
  }, [tripId])

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <CaliforniaMap events={events} />
    </main>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-400">Loading map...</div>}>
      <MapContent />
    </Suspense>
  )
}