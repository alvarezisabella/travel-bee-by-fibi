"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { LABEL_MAP } from "@/app/itinerary/types/types"
import { GeneratedItinerary, GeneratedEvent } from "@/app/api/ai/generate-itinerary/route"

// ─── Types ────────────────────────────────────────────────────────────────────

// The shape stored in sessionStorage by the landing page form after calling
// POST /api/ai/generate-itinerary. All fields are needed to save the itinerary.
interface DraftData {
  itinerary: GeneratedItinerary
  location: string
  startDate: string
  endDate: string
  numTravelers: number
  description: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Converts a duration in minutes to a human-readable string (e.g. 90 → "1 hr 30 min")
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

// Formats a "YYYY-MM-DD" date string to a readable label (e.g. "October 1, 2024").
// The T12:00:00 suffix prevents timezone offset from shifting the date by a day.
function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

// Converts a "YYYY-MM-DD" date to a short "Oct 1" label for the trip header
function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

// ─── Event Preview Card ───────────────────────────────────────────────────────

// Renders a single AI-generated event in a read-only preview style.
// Simpler than the full EventCard — no votes, no lock, no edit.
// Uses the same LABEL_MAP color scheme as the real itinerary page for visual consistency.
function EventPreviewCard({ event }: { event: GeneratedEvent }) {
  // Look up the color scheme for this event type, fall back to neutral gray if unknown
  const colors = LABEL_MAP[event.type as keyof typeof LABEL_MAP] ?? {
    bg: 'bg-[#f5f5f5]', bar: 'bg-[#aaaaaa]', text: 'text-[#333333]', time: 'text-[#666666]',
  }

  return (
    <div className={`flex rounded-xl overflow-hidden shadow-sm ${colors.bg}`}>
      {/* Left colored bar — same visual as EventCard on the itinerary page */}
      <div className={`w-1.5 flex-shrink-0 ${colors.bar}`} />

      <div className="flex flex-col gap-1 px-4 py-3 flex-1 min-w-0">
        {/* Top row: event type badge + time + duration */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bar} text-white`}>
            {event.type}
          </span>
          <span className={`text-xs font-medium ${colors.time}`}>
            {event.startTime} · {formatDuration(event.duration)}
          </span>
        </div>

        {/* Event title */}
        <p className={`text-sm font-semibold leading-snug ${colors.text}`}>
          {event.title}
        </p>

        {/* Location (if provided) */}
        {event.location && (
          <p className="text-xs text-gray-500 truncate">{event.location}</p>
        )}

        {/* Description (if provided) */}
        {event.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// AI Template Page — displays the AI-generated itinerary for user review before saving.
// Data flows in via sessionStorage (key: "travelbee_draft") which is set by the
// landing page form after calling POST /api/ai/generate-itinerary.
// Nothing is written to the database until the user clicks "Save to My Trips".
export default function AITemplatePage() {
  const router = useRouter()

  // draft holds the full generated itinerary + form metadata from sessionStorage
  const [draft, setDraft] = useState<DraftData | null>(null)

  // notFound is true when sessionStorage is missing or unparseable on mount
  const [notFound, setNotFound] = useState(false)

  // Saving state for the Save button loading indicator
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // On mount: verify auth first, then load draft from sessionStorage.
  // Auth must resolve before reading the draft — if we read sessionStorage
  // synchronously before getSession() resolves, unauthenticated users briefly
  // see the itinerary preview before being redirected, which is a confusing flash.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Not logged in — redirect to login. The redirect param returns the user
      // here after they authenticate so they can still save their itinerary.
      if (!session) {
        router.push('/login?redirect=/ai-template')
        return
      }

      // Auth confirmed — now safe to read the draft from sessionStorage.
      // If the key is missing (e.g. user navigated here directly, or refreshed
      // after sessionStorage was cleared), show a "not found" message.
      const raw = sessionStorage.getItem('travelbee_draft')
      if (!raw) {
        setNotFound(true)
        return
      }

      try {
        const parsed = JSON.parse(raw) as DraftData
        // Basic sanity check — ensure the parsed object has the minimum required fields
        if (!parsed.itinerary || !parsed.location || !parsed.startDate || !parsed.endDate) {
          setNotFound(true)
          return
        }
        setDraft(parsed)
      } catch {
        // JSON.parse failed — draft is corrupt; treat it as not found
        setNotFound(true)
      }
    })
  }, [router])

  // Persists the reviewed itinerary to Supabase via the save-itinerary API route.
  // Called only when the user explicitly clicks "Save to My Trips".
  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    setSaveError('')

    try {
      const res = await fetch('/api/ai/save-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary: draft.itinerary,
          location: draft.location,
          startDate: draft.startDate,
          endDate: draft.endDate,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error ?? 'Failed to save. Please try again.')
        return
      }

      // Remove the draft from sessionStorage so stale data doesn't appear
      // if the user navigates back to this page later
      sessionStorage.removeItem('travelbee_draft')

      // Redirect to the full itinerary page where they can edit, invite, and manage
      router.push(`/itinerary/${data.itineraryId}`)
    } finally {
      setSaving(false)
    }
  }

  // ── No draft found ──────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 text-lg">No itinerary found.</p>
        <p className="text-gray-400 text-sm text-center">
          This page is only accessible after generating an itinerary from the home page.
        </p>
        <Link href="/" className="text-sm text-yellow-600 font-medium hover:underline">
          ← Go back to generate one
        </Link>
      </main>
    )
  }

  // ── Loading state while draft is being read from sessionStorage ─────────────
  if (!draft) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F5C842] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  // ── Itinerary Preview ───────────────────────────────────────────────────────
  const { itinerary, location, startDate, endDate, numTravelers } = draft

  return (
    <main className="min-h-screen bg-[#F5F5F5]">

      {/* ── Sticky action bar at the top ──────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Go Back — returns the user to the landing page where they can regenerate */}
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
            ← Go Back
          </button>

          <div className="flex items-center gap-3">
            {/* Save error shown inline next to the button */}
            {saveError && (
              <p className="text-xs text-red-500">{saveError}</p>
            )}

            {/* Save button — only available once the user is satisfied with the preview */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#F5C842] hover:bg-[#e6b93a] text-gray-900 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save to My Trips'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Trip header banner ─────────────────────────────────────────────── */}
      {/* Uses a gradient placeholder instead of a cover photo — the user can
          add a real cover photo after saving from the itinerary page */}
      <div className="w-full bg-gradient-to-br from-gray-700 to-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* AI-generated trip title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
            {itinerary.title}
          </h1>

          {/* Trip metadata: location · dates · travelers */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-300 text-sm">
            <span>{location}</span>
            <span className="text-gray-500">·</span>
            <span>{formatShortDate(startDate)} – {formatShortDate(endDate)}</span>
            <span className="text-gray-500">·</span>
            <span>{numTravelers} traveler{numTravelers !== 1 ? 's' : ''}</span>
          </div>

          {/* Preview label so the user knows this hasn't been saved yet */}
          <div className="mt-4 inline-flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-400/30 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C842]" />
            <span className="text-xs font-medium text-yellow-300">AI Preview — not saved yet</span>
          </div>
        </div>
      </div>

      {/* ── Day-by-day itinerary ───────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {itinerary.days.map((day, dayIndex) => (
          <section key={day.date}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-4">
              {/* Day number pill */}
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5C842] flex items-center justify-center text-xs font-bold text-gray-900">
                {dayIndex + 1}
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Day {dayIndex + 1}
                </p>
                <p className="text-sm font-medium text-gray-700">{formatDate(day.date)}</p>
              </div>
            </div>

            {/* Event cards for this day */}
            <div className="flex flex-col gap-3 ml-11">
              {day.events.map((event, eventIndex) => (
                <EventPreviewCard key={`${day.date}-${eventIndex}`} event={event} />
              ))}
            </div>
          </section>
        ))}

        {/* Bottom save CTA — convenience copy so user doesn't have to scroll back up */}
        <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Happy with this itinerary? Save it to your trips and start customizing.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-[#F5C842] hover:bg-[#e6b93a] text-gray-900 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save to My Trips'}
          </button>
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
        </div>
      </div>

    </main>
  )
}
