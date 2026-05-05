"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LABEL_MAP } from "@/app/itinerary/types/types"
import { GeneratedItinerary, GeneratedEvent } from "@/app/api/ai/generate-itinerary/route"
import { ChevronDown, Bookmark } from "lucide-react"

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

const ESTIMATED_TOTAL_CHARS = 6000

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

function formatTime(time: string): string {
  if (!time) return ""
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  const mins = m.toString().padStart(2, "0")
  return `${hour}:${mins} ${ampm}`
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

function TripPickerModal({
  trips,
  onSelect,
  onClose,
  saving,
}: {
  trips: { id: string; title: string | null; location: string | null }[]
  onSelect: (tripId: string) => void
  onClose: () => void
  saving: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Save to a trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        {trips.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No saved trips yet. Save this itinerary first!</p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {trips.map(trip => (
              <li key={trip.id}>
                <button
                  onClick={() => onSelect(trip.id)}
                  disabled={saving}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-all disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-gray-800">{trip.title ?? "Untitled Trip"}</p>
                  {trip.location && <p className="text-xs text-gray-400">{trip.location}</p>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function EventPreviewCard({
  event,
  animationDelay,
  onBookmark,
  isBookmarked,
}: {
  event: GeneratedEvent
  animationDelay: number
  onBookmark?: () => void
  isBookmarked?: boolean
}) {
  const colors = LABEL_MAP[event.type as keyof typeof LABEL_MAP] ?? {
    bg: "bg-[#f5f5f5]", bar: "bg-[#aaaaaa]", text: "text-[#333333]", time: "text-[#666666]",
  }

  return (
    <div
      className={`flex rounded-xl overflow-hidden bg-white border border-gray-200 opacity-0`}
      style={{ animation: `fadeSlideIn 0.4s ease ${animationDelay}ms forwards`, boxShadow: "0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Left time panel */}
      <div className={`flex flex-col items-center justify-center w-24 flex-shrink-0 py-4 border-r border-gray-100 ${colors.bg}`}>
        <span className={`text-[15px] font-bold ${colors.text}`}>{formatTime(event.startTime)}</span>
        <span className="text-[11px] text-gray-400 mt-1">{formatDuration(event.duration)}</span>
      </div>

      {/* Right content */}
      <div className="flex flex-col gap-1.5 px-5 py-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold text-gray-900 leading-snug">{event.title}</p>
          {onBookmark && (
            <button
              onClick={onBookmark}
              aria-label="Save to trip"
              className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-yellow-500 transition-colors"
            >
              <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} className={isBookmarked ? "text-yellow-500" : ""} />
            </button>
          )}
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full self-start ${colors.bar} text-white`}>
          {event.type}
        </span>
        {event.location && (
          <p className="text-[12px] text-gray-400 truncate">{event.location}</p>
        )}
        {event.description && (
          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  )
}

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
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [msgIndex, setMsgIndex] = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set())
  const [userTrips, setUserTrips] = useState<{ id: string; title: string | null; location: string | null }[]>([])
  const [bookmarkModal, setBookmarkModal] = useState<{ event: GeneratedEvent; key: string } | null>(null)
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set())
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [shouldAutoSave, setShouldAutoSave] = useState(false)

  const toggleDay = (index: number) => {
    setCollapsedDays(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!destination || !startDate || !endDate) {
      router.push("/")
      return
    }

    const supabase = createClient()
    const autoSave = searchParams.get("autoSave") === "1"

    // If returning from login, restore the existing draft instead of re-generating
    const existingDraft = sessionStorage.getItem("travelbee_draft")
    if (existingDraft) {
      try {
        const draft = JSON.parse(existingDraft)
        if (draft.location === destination && draft.startDate === startDate && draft.endDate === endDate) {
          setItinerary(draft.itinerary)
          setCoverPhoto(draft.coverPhoto ?? null)
          setStatus("done")
          if (autoSave) setShouldAutoSave(true)
          return
        }
      } catch {}
    }

    // Fetch user trips for bookmark functionality if authenticated (non-blocking)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase
        .from("itineraries")
        .select("id, title, location")
        .eq("created_by", session.user.id)
        .eq("is_recommendation", false)
        .order("updated_at", { ascending: false })
        .then(({ data }) => setUserTrips(data ?? []))
    })

    const abort = new AbortController()
    abortRef.current = abort

    const msgTimer = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length)
        setMsgVisible(true)
      }, 250)
    }, 2400)

    let receivedChars = 0

    ;(async () => {
      try {
        const res = await fetch("/api/ai/generate-itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: destination, startDate, endDate, numTravelers: travelers, description }),
          signal: abort.signal,
        })

        if (!res.ok || !res.body) throw new Error("Request failed")

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""

          for (const part of parts) {
            if (!part.startsWith("data: ")) continue
            let payload: { type: string; text?: string; itinerary?: GeneratedItinerary; coverPhoto?: string; message?: string }
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
              console.log("[Plan] Cover photo received:", payload.coverPhoto ?? "none")
              setTimeout(() => {
                sessionStorage.setItem("travelbee_draft", JSON.stringify({
                  itinerary: payload.itinerary,
                  location: destination,
                  startDate,
                  endDate,
                  numTravelers: travelers,
                  description,
                  coverPhoto: payload.coverPhoto ?? null,
                }))
                setItinerary(payload.itinerary!)
                setCoverPhoto(payload.coverPhoto ?? null)
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
    })()

    return () => { abortRef.current?.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (shouldAutoSave && itinerary && status === "done") {
      setShouldAutoSave(false)
      handleSave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoSave, itinerary, status])

  const handleBookmarkSave = async (tripId: string) => {
    if (!bookmarkModal) return
    setBookmarkSaving(true)
    try {
      await fetch("/api/auth/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itinerary_id: tripId,
          title: bookmarkModal.event.title,
          type: bookmarkModal.event.type,
          location: bookmarkModal.event.location ?? null,
          description: bookmarkModal.event.description ?? null,
        }),
      })
      setBookmarkedKeys(prev => new Set(prev).add(bookmarkModal.key))
      setBookmarkModal(null)
    } finally {
      setBookmarkSaving(false)
    }
  }

  const handleSave = async () => {
    if (!itinerary) return

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(`/plan?${searchParams.toString()}&autoSave=1`)}`)
      return
    }

    setSaving(true)
    setSaveError("")

    try {
      const res = await fetch("/api/ai/save-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itinerary,
          location: destination,
          startDate,
          endDate,
          coverPhoto,
        }),
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

  if (status === "error") {
    return (
      <main className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-2xl">✈️</p>
        <p className="text-gray-700 font-medium text-center">{errorMsg}</p>
        <button onClick={() => router.push("/")} className="text-sm text-yellow-600 font-medium hover:underline">
          ← Go back and try again
        </button>
      </main>
    )
  }

  if (status === "generating") {
    return (
      <main className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <div className="w-full h-1 bg-gray-200">
          <div className="h-full bg-[#F5C300] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="text-5xl animate-bounce" style={{ animationDuration: "1.8s" }}>🐝</div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-800 font-semibold text-lg">Agent Atlas is planning your trip</p>
            {destination && startDate && endDate && (
              <p className="text-sm text-gray-400">
                {destination} · {formatShortDate(startDate)} – {formatShortDate(endDate)}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-500 transition-opacity duration-300" style={{ opacity: msgVisible ? 1 : 0 }}>
            {LOADING_MESSAGES[msgIndex]}
          </p>
          <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#F5C300] rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Trip header — full bleed, touches navbar, action buttons overlaid */}
      <div
        className="w-full px-4 relative"
        style={{
          background: coverPhoto
            ? `linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.65)), url(${coverPhoto}) center/cover no-repeat`
            : "linear-gradient(to bottom right, #374151, #111827)",
          minHeight: "280px",
        }}
      >
        {/* Go Back + Save overlaid at top of header */}
        <div className="max-w-5xl mx-auto pt-5 pb-0 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/80 hover:text-white font-medium transition-colors"
          >
            ← Go Back
          </button>
          <div className="flex items-center gap-3">
            {saveError && <p className="text-xs text-red-300">{saveError}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#F5C842] hover:bg-[#e6b93a] text-gray-900 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save to My Trips"}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto py-10">
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
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {destination}
            </span>
            <span className="text-gray-500">·</span>
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
              </svg>
              {formatShortDate(startDate)} – {formatShortDate(endDate)}
            </span>
            <span className="text-gray-500">·</span>
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              {travelers} traveler{travelers !== 1 ? "s" : ""}
            </span>
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
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        {itinerary!.days.map((day, dayIndex) => (
          <section key={day.date}>
            <div
              className="flex items-center gap-3 mb-4 opacity-0"
              style={{ animation: `fadeSlideIn 0.4s ease forwards ${dayIndex * 60}ms` }}
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5C842] flex items-center justify-center text-sm font-bold text-gray-900">
                {dayIndex + 1}
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Day {dayIndex + 1}
                </p>
                <p className="text-sm font-medium text-gray-700">{formatDate(day.date)}</p>
              </div>
              <button
                onClick={() => toggleDay(dayIndex)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-200 ${collapsedDays.has(dayIndex) ? '-rotate-90' : ''}`}
                />
              </button>
            </div>

            {!collapsedDays.has(dayIndex) && (
              <div className="flex flex-col gap-3 ml-11">
                {day.events.map((event, eventIndex) => {
                  const key = `${day.date}-${eventIndex}`
                  return (
                    <EventPreviewCard
                      key={key}
                      event={event}
                      animationDelay={dayIndex * 60 + eventIndex * 50 + 80}
                      isBookmarked={bookmarkedKeys.has(key)}
                      onBookmark={() => setBookmarkModal({ event, key })}
                    />
                  )
                })}
              </div>
            )}
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

      {bookmarkModal && (
        <TripPickerModal
          trips={userTrips}
          onSelect={handleBookmarkSave}
          onClose={() => setBookmarkModal(null)}
          saving={bookmarkSaving}
        />
      )}
    </main>
  )
}

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