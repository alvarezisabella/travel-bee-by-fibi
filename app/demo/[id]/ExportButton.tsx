"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { DEMO_ITINERARIES } from '../demoData'

export default function ExportButton({ demoId }: { demoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)

    const demo = DEMO_ITINERARIES[demoId]
    if (!demo) return

    try {
      const itinRes = await fetch('/api/auth/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: demo.title,
          location: demo.location,
          start_date: demo.startDate,
          end_date: demo.endDate,
          cover_photo_url: demo.coverImg,
        }),
      })

      if (!itinRes.ok) {
        const data = await itinRes.json()
        // If not logged in, redirect to login
        if (itinRes.status === 401) {
          router.push(`/auth/login?redirect=/demo/${demoId}`)
          return
        }
        throw new Error(data.error ?? 'Failed to create itinerary')
      }

      const { id: newTripId } = await itinRes.json()

      for (const day of demo.days) {
        for (const event of day.events) {
          const endsAt = (() => {
            const [h, m] = event.startTime.split(':').map(Number)
            const total = h * 60 + m + event.duration
            const eh = Math.floor(total / 60) % 24
            const em = total % 60
            return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
          })()

          await fetch('/api/auth/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itinerary_id: newTripId,
              title: event.title,
              description: event.description,
              type: event.type,
              status: event.status,
              starts_at: event.startTime,
              ends_at: endsAt,
              location: event.location,
              day: day.date,
            }),
          })
        }
      }

      router.push(`/itinerary/${newTripId}`)
    } catch (err: any) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 bg-[#F5C300] hover:bg-[#d4a800] disabled:opacity-50 text-[#3d3000] font-semibold text-[14px] px-6 py-2.5 rounded-xl transition-colors whitespace-nowrap"
      >
        {loading ? (
          <><Loader2 size={14} className="animate-spin" /> Exporting...</>
        ) : (
          '+ Export to my trips'
        )}
      </button>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  )
}