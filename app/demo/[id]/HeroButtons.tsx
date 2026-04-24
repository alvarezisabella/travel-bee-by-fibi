// app/demo/[id]/HeroButtons.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_ITINERARIES } from '../demoData'

interface Props {
  demoId: string
}

export default function HeroButtons({ demoId }: Props) {
  const router = useRouter()
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [loadingExport, setLoadingExport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Shared: create itinerary + all events, return new trip ID
  async function createTripFromDemo(): Promise<string | null> {
    const demo = DEMO_ITINERARIES[demoId]
    if (!demo) return null

    // Create blank itinerary
    const itinRes = await fetch('/api/auth/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!itinRes.ok) throw new Error('Failed to create itinerary')

    const { itinerary } = await itinRes.json()
    const newTripId = itinerary?.id
    if (!newTripId) throw new Error('No itinerary ID returned')

    // Populate title, location, dates, cover photo
    await fetch('/api/auth/itinerary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newTripId,
        title: demo.title,
        location: demo.location,
        start_date: demo.startDate,
        end_date: demo.endDate,
        cover_photo_url: demo.coverImg,
      }),
    })

    // Create all events
    for (const day of demo.days) {
      for (const event of day.events) {
        const res = await fetch('/api/auth/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itineraryid: newTripId,
            title: event.title,
            description: event.description,
            type: event.type,
            status: event.status,
            startTime: event.startTime,
            duration: event.duration,
            location: event.location,
            day: day.date,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          console.error('Event insert failed:', err)
        }
      }
    }

    return newTripId
  }

  // EDIT: create trip, mark as recommendation, open editable itinerary page
  async function handleEdit() {
    setLoadingEdit(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?redirect=/demo/${demoId}&action=edit`)
        return
      }

      const newTripId = await createTripFromDemo()
      if (!newTripId) return

      // Mark as Atlas recommendation so it shows in the right section
      await supabase
        .from('itineraries')
        .update({ is_recommendation: true })
        .eq('id', newTripId)

      router.push(`/itinerary/${newTripId}`)
    } catch (err: any) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setLoadingEdit(false)
    }
  }

  // EXPORT: create trip, mark as recommendation, redirect to profile
  async function handleExport() {
    setLoadingExport(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?redirect=/demo/${demoId}&action=export`)
        return
      }

      const newTripId = await createTripFromDemo()
      if (!newTripId) return

      // Mark as Atlas recommendation
      await supabase
        .from('itineraries')
        .update({ is_recommendation: true })
        .eq('id', newTripId)

      router.push('/profile')
    } catch (err: any) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setLoadingExport(false)
    }
  }

  const isLoading = loadingEdit || loadingExport

  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-50 text-white font-semibold text-[13px] px-5 py-2.5 rounded-full border border-white/30 transition-colors whitespace-nowrap"
        >
          {loadingEdit
            ? <><Loader2 size={13} className="animate-spin" /> Setting up...</>
            : <><Pencil size={13} /> Edit</>
          }
        </button>

        <button
          onClick={handleExport}
          disabled={isLoading}
          className="flex items-center gap-2 bg-[#F5C300] hover:bg-[#d4a800] disabled:opacity-50 text-[#3d3000] font-semibold text-[13px] px-5 py-2.5 rounded-full shadow-md transition-colors whitespace-nowrap"
        >
          {loadingExport
            ? <><Loader2 size={13} className="animate-spin" /> Exporting...</>
            : '+ Export to my trips'
          }
        </button>
      </div>
      {error && <p className="text-[11px] text-red-300 mt-1">{error}</p>}
    </div>
  )
}