"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LABEL_MAP } from "@/app/itinerary/types/types"
import { GeneratedItinerary, GeneratedEvent } from "@/app/api/ai/generate-itinerary/route"

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Mapping out your adventure...",
  "Scouting the best local spots...",
  "Planning your mornings...",
  "Finding hidden gems...",
  "Lining up the best meals...",
  "Balancing sightseeing and downtime...",
  "Checking local highlights...",
  "Adding some local flavor...",
  "Putting the finishing touches...",
  "Almost ready...",
]

const BUDGET_RANGES: Record<string, string> = {
  Budget: "Budget (Under $500)",
  "Mid-range": "Mid-range ($500 – $2,000)",
  Luxury: "Luxury ($2,000+)",
}

// Approximate total chars in a typical Claude itinerary response.
// Used to estimate progress from received chunk bytes.
const ESTIMATED_TOTAL_CHARS = 6000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  })
}

// ─── Event Preview Card ───────────────────────────────────────────────────────

function EventPreviewCard({ event, animationDelay }: { event: GeneratedEvent; animationDelay: number }) {
  const colors = LABEL_MAP[event.type as keyof typeof LABEL_MAP] ?? {
    bg: "bg-[#f5f5f5]", bar: "bg-[#aaaaaa]", text: "text-[#333333]", time: "text-[#666666]",
  }

  return (
    <div
      className={`flex rounded-xl overflow-hidden shadow-sm ${colors.bg} opacity-0`}
      style={{ animation: `fadeSlideIn 0.4s ease ${animationDelay}ms forwards` }}
    >
      <div className={`w-1.5 flex-shrink-0 ${colors.bar}`} />
      <div className="flex flex-col gap-1 px-4 py-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bar} text-white`}>
            {event.type}
          </span>
          <span className={`text-xs font-medium ${colors.time}`}>
            {event.startTime} · {formatDuration(event.duration)}
          </span>
        </div>
        <p className={`text-sm font-semibold leading-snug ${colors.text}`}>{event.title}</p>
        {event.location && (
          <p className="text-xs text-gray-500 truncate">{event.location}</p>
        )}
        {event.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Content (needs Suspense for useSearchParams) ────────────────────────

function PlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const destination = searchParams.get("destination") ?? ""
  const travelers = Number(searchParams.get("travelers") ?? "2")
  const startDate = searchParams.get("startDate") ?? ""
  const endDate = searchParams.get("endDate") ?? ""
  const budget = searchParams.get("budget") ?? ""
  const rawDescription = searchParams.get("description") ?? ""

  const description = budget
    ? `${rawDescription}${rawDescription ? " " : ""}Budget: ${BUDGET_RANGES[budget] ?? budget}`.trim()
    : rawDescription

  type Status = "generating" | "done" | "error"

  const [status, setStatus] = useState<Status>("generating")
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [msgIndex, setMsgIndex] = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!destination || !startDate || !endDate) {
      router.push("/")
      return
    }

    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push(`/login?redirect=${encodeURIComponent(`/plan?${searchParams.toString()}`)}`)
        return
      }

      const abort = new AbortController()
      abortRef.current = abort

      // Cycle loading messages with a fade effect
      const msgTimer = setInterval(() => {
        setMsgVisible(false)
        setTimeout(() => {
          setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length)
          setMsgVisible(true)
        }, 250)
      }, 2400)

      let receivedChars = 0

      try {
        const res = await fetch("/api/ai/generate-itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: destination, startDate, endDate, numTravelers: travelers, description }),
          signal: abort.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error("Request failed")
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE events are separated by double newlines
          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""

          for (const part of parts) {
            if (!part.startsWith("data: ")) continue
            let payload: { type: string; text?: string; itinerary?: GeneratedItinerary; message?: string }
            try {
              payload = JSON.parse(part.slice(6))
            } catch {
              continue
            }

            if (payload.type === "chunk" && payload.text) {
              receivedChars += payload.text.length
              setProgress(Math.min(90, (receivedChars / ESTIMATED_TOTAL_CHARS) * 90))
            } else if (payload.type === "done" && payload.itinerary) {
              clearInterval(msgTimer)
              setProgress(100)

              // Small delay so the bar visually completes before reveal
              setTimeout(() => {
                sessionStorage.setItem("travelbee_draft", JSON.stringify({
                  itinerary: payload.itinerary,
                  location: destination,
                  startDate,
                  endDate,
                  numTravelers: travelers,
                  description,
                }))
                setItinerary(payload.itinerary!)
                setStatus("done")
              }, 350)
            } else if (payload.type === "error") {
              clearInterval(msgTimer)
              setErrorMsg(payload.message ?? "Something went wrong. Please try again.")
              setStatus("error")
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          clearInterval(msgTimer)
          setErrorMsg("Something went wrong. Please try again.")
          setStatus("error")
        }
      }
    })

    return () => {
      abortRef.current?.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    if (!itinerary) return
    setSaving(true)
    setSaveError("")

    try {
      const res = await fetch("/api/ai/save-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary, location: destination, startDate, endDate }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save. Please try again.")
        return
      }

      sessionStorage.removeItem("travelbee_draft")
      router.push(`/itinerary/${data.itineraryId}`)
    } finally {
      setSaving(false)
    }
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <main className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-2xl">✈️</p>
        <p className="text-gray-700 font-medium text-center">{errorMsg}</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-yellow-600 font-medium hover:underline"
        >
          ← Go back and try again
        </button>
      </main>
    )
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (status === "generating") {
    return (
      <main className="min-h-screen bg-[#F5F5F5] flex flex-col">
        {/* Progress bar at very top */}
        <div className="w-full h-1 bg-gray-200">
          <div
            className="h-full bg-[#F5C300] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
          {/* Bee / plane icon with pulse */}
          <div className="text-5xl animate-bounce" style={{ animationDuration: "1.8s" }}>
            🐝
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-800 font-semibold text-lg">
              Agent Atlas is planning your trip
            </p>
            {destination && startDate && endDate && (
              <p className="text-sm text-gray-400">
                {destination} · {formatShortDate(startDate)} – {formatShortDate(endDate)}
              </p>
            )}
          </div>

          {/* Cycling status message with fade */}
          <p
            className="text-sm text-gray-500 transition-opacity duration-300"
            style={{ opacity: msgVisible ? 1 : 0 }}
          >
            {LOADING_MESSAGES[msgIndex]}
          </p>

          {/* Progress bar (wider, below text) */}
          <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F5C300] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </main>
    )
  }

  // ── Itinerary preview ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      {/* Keyframe animation injected once */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Sticky action bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
            ← Go Back
          </button>

          <div className="flex items-center gap-3">
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#F5C842] hover:bg-[#e6b93a] text-gray-900 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save to My Trips"}
            </button>
          </div>
        </div>
      </div>

      {/* Trip header */}
      <div className="w-full bg-gradient-to-br from-gray-700 to-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3 opacity-0"
            style={{ animation: "fadeSlideIn 0.5s ease forwards" }}
          >
            {itinerary!.title}
          </h1>

          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-300 text-sm opacity-0"
            style={{ animation: "fadeSlideIn 0.5s ease forwards 100ms" }}
          >
            <span>{destination}</span>
            <span className="text-gray-500">·</span>
            <span>{formatShortDate(startDate)} – {formatShortDate(endDate)}</span>
            <span className="text-gray-500">·</span>
            <span>{travelers} traveler{travelers !== 1 ? "s" : ""}</span>
          </div>

          <div
            className="mt-4 inline-flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-400/30 rounded-full px-3 py-1 opacity-0"
            style={{ animation: "fadeSlideIn 0.5s ease forwards 200ms" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C842]" />
            <span className="text-xs font-medium text-yellow-300">AI Preview — not saved yet</span>
          </div>
        </div>
      </div>

      {/* Day-by-day itinerary */}
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {itinerary!.days.map((day, dayIndex) => (
          <section key={day.date}>
            <div
              className="flex items-center gap-3 mb-4 opacity-0"
              style={{ animation: `fadeSlideIn 0.4s ease forwards ${dayIndex * 60}ms` }}
            >
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

            <div className="flex flex-col gap-3 ml-11">
              {day.events.map((event, eventIndex) => (
                <EventPreviewCard
                  key={`${day.date}-${eventIndex}`}
                  event={event}
                  animationDelay={dayIndex * 60 + eventIndex * 50 + 80}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Bottom save CTA */}
        <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Happy with this itinerary? Save it to your trips and start customizing.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-[#F5C842] hover:bg-[#e6b93a] text-gray-900 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save to My Trips"}
          </button>
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
        </div>
      </div>
    </main>
  )
}

// ─── Page export (Suspense required for useSearchParams) ──────────────────────

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#F5C842] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <PlanContent />
    </Suspense>
  )
}
