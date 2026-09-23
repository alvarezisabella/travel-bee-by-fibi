"use client"
import { useEffect, useState } from "react"
import type { Day } from "@/app/itinerary/day"

export function useTripDays(tripId: string) {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/auth/itinerary?id=${tripId}`)
        const data = await res.json()
        if (!cancelled) setDays(data.days ?? [])
      } catch {
        if (!cancelled) setDays([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [tripId])

  return { days, loading }
}