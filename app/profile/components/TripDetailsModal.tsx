"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2, BedDouble } from "lucide-react"
import DateRangePicker from "@/components/landing/DateRangePicker"
import LocationSearch from "@/app/itinerary/components/LocationSearch"

interface Coords {
  lat: number
  lng: number
}

interface PlaceValue {
  label: string
  coords: Coords | null
}

const MAX_TRAVELERS = 8

// Formats a local Date as YYYY-MM-DD without shifting it through UTC
function toDateString(d: Date) {
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

// Keeps coords only while the text still matches the place they were resolved for
function updatePlace(prev: PlaceValue, label: string, coords?: Coords): PlaceValue {
  if (coords) return { label, coords }
  if (label === prev.label) return prev
  return { label, coords: null }
}

export default function TripDetailsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [destination, setDestination] = useState<PlaceValue>({ label: "", coords: null })
  const [stay, setStay] = useState<PlaceValue>({ label: "", coords: null })
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [travelers, setTravelers] = useState<number | null>(null)
  const [mood, setMood] = useState("")
  const [submitting, setSubmitting] = useState<"create" | "skip" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const moodRef = useRef<HTMLTextAreaElement>(null)

  // Close on Escape and lock page scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, submitting])

  function decrementTravelers() {
    setTravelers(t => {
      if (t === null || t <= 1) return null
      return t - 1
    })
  }

  function incrementTravelers() {
    setTravelers(t => {
      if (t === null) return 1
      return Math.min(MAX_TRAVELERS, t + 1)
    })
  }

  async function createTrip(mode: "create" | "skip") {
    setSubmitting(mode)
    setError(null)

    let body = {}
    if (mode === "create") {
      body = {
        title,
        start_date: startDate ? toDateString(startDate) : null,
        end_date: endDate ? toDateString(endDate) : null,
        location: destination.label,
        lat: destination.coords?.lat ?? null,
        lng: destination.coords?.lng ?? null,
        num_travelers: travelers,
        travel_mood: mood,
        stay_location: stay.label,
        stay_lat: stay.coords?.lat ?? null,
        stay_lng: stay.coords?.lng ?? null,
      }
    }

    try {
      const res = await fetch("/api/auth/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const raw = await res.text()
      let data: { itinerary?: { id?: string }; error?: string } = {}
      try {
        data = JSON.parse(raw)
      } catch {
        console.error("Create trip returned non-JSON:", res.status, raw)
      }

      if (res.ok && data.itinerary?.id) {
        router.push(`/itinerary/${data.itinerary.id}`)
        return
      }
      console.error("Create trip failed:", res.status, raw)
      setError(data.error ?? `Couldn't create your trip (error ${res.status}). Please try again.`)
    } catch (err) {
      console.error("Failed to create trip:", err)
      setError("Couldn't create your trip. Please try again.")
    }
    setSubmitting(null)
  }

  const labelCls = "block text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-1.5"
  const sectionCls = "p-4 px-4 sm:px-6 border-b border-gray-100"

  let travelersLabel = "Add"
  if (travelers !== null) {
    travelersLabel = travelers >= MAX_TRAVELERS ? `${MAX_TRAVELERS}+` : String(travelers)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget && !submitting) onClose() }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Trip Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Everything here is optional, but the more we know, the better{" "}
              <strong className="font-medium text-gray-700">Agent Atlas</strong> can tailor your recommendations. 🐝
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting !== null}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div className="overflow-y-auto px-5 sm:px-6">
          <div className="border border-gray-100 rounded-2xl">

            {/* Trip title */}
            <div className={sectionCls}>
              <span className={labelCls}>Trip title</span>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Summer in Lisbon"
                maxLength={100}
                className="w-full bg-transparent outline-none text-[15px] text-gray-900 placeholder:text-gray-300"
              />
            </div>

            {/* Destination */}
            <div className={sectionCls}>
              <span className={labelCls}>Destination</span>
              <LocationSearch
                value={destination.label}
                onChange={val => setDestination(prev => updatePlace(prev, val))}
                onClose={(val, coords) => setDestination(prev => updatePlace(prev, val, coords))}
                placeholder="Where are you headed?"
                autoFocus={false}
                className="w-full"
              />
            </div>

            {/* Dates */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
            />

            {/* Travelers + Stay */}
            <div className="flex flex-col sm:flex-row border-b border-gray-100">
              <div className="p-4 px-4 sm:px-6 border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col items-center justify-center text-center">
                <span className={labelCls}>Travelers</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={decrementTravelers}
                    disabled={travelers === null}
                    aria-label="Fewer travelers"
                    className="w-6 h-6 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >−</button>
                  <span className={`text-base font-medium w-8 text-center ${travelers === null ? "text-gray-300" : "text-gray-900"}`}>
                    {travelersLabel}
                  </span>
                  <button
                    onClick={incrementTravelers}
                    disabled={travelers !== null && travelers >= MAX_TRAVELERS}
                    aria-label="More travelers"
                    className="w-6 h-6 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >+</button>
                </div>
              </div>

              <div className="flex-1 p-4 px-4 sm:px-6 min-w-0">
                <span className={`${labelCls} flex items-center gap-1`}>
                  <BedDouble size={12} /> Where you&apos;re staying
                </span>
                <LocationSearch
                  value={stay.label}
                  onChange={val => setStay(prev => updatePlace(prev, val))}
                  onClose={(val, coords) => setStay(prev => updatePlace(prev, val, coords))}
                  placeholder="Hotel, Airbnb, or address"
                  autoFocus={false}
                  className="w-full"
                />
              </div>
            </div>

            {/* Travel mood */}
            <div className="p-4 px-4 sm:px-6">
              <span className={labelCls}>Travel mood</span>
              <div className="flex items-start gap-2">
                <span className="text-sm opacity-50 mt-0.5">✨</span>
                <textarea
                  ref={moodRef}
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                  onInput={() => {
                    if (moodRef.current) {
                      moodRef.current.style.height = "auto"
                      moodRef.current.style.height = moodRef.current.scrollHeight + "px"
                    }
                  }}
                  placeholder="e.g. Relaxed beach days, great local food, and a rooftop bar or two…"
                  rows={2}
                  maxLength={300}
                  className="flex-1 bg-transparent outline-none resize-none overflow-hidden text-[15px] text-gray-900 placeholder:text-gray-300 leading-relaxed"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 pt-4 flex flex-col gap-2">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => createTrip("skip")}
              disabled={submitting !== null}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting === "skip" && <Loader2 size={14} className="animate-spin" />}
              Skip for now
            </button>
            <button
              onClick={() => createTrip("create")}
              disabled={submitting !== null}
              className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#F5C842] px-6 text-sm font-semibold text-gray-900 transition-all hover:bg-[#e6b93a] disabled:opacity-50"
            >
              {submitting === "create" && <Loader2 size={14} className="animate-spin" />}
              {submitting === "create" ? "Creating..." : "Create Trip"}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
