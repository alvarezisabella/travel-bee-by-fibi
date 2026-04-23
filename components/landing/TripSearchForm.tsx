"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const budgetTiers = [
  { signs: "$",    label: "Budget",    range: "Under $500"      },
  { signs: "$$",   label: "Mid-range", range: "$500 – $2,000"   },
  { signs: "$$$",  label: "Premium",   range: "$2,000 – $5,000" },
  { signs: "$$$$", label: "Luxury",    range: "$5,000+"         },
]

export default function TripSearchForm() {
  const router = useRouter()
  const [destination, setDestination] = useState("")
  const [travelers, setTravelers] = useState(2)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budgetTier, setBudgetTier] = useState(1)
  const [description, setDescription] = useState("")
  const [nights, setNights] = useState<number | null>(7)
  // Loading/error state for the "Plan my trip" action
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const fmt = (d: Date) => d.toISOString().split("T")[0]
    const t = new Date()
    const s = new Date(t); s.setDate(t.getDate() + 14)
    const e = new Date(s); e.setDate(s.getDate() + 7)
    setStartDate(fmt(s))
    setEndDate(fmt(e))
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      const d = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
      setNights(d > 0 ? d : null)
    }
  }, [startDate, endDate])

  async function handlePlan() {
    if (!destination.trim()) return
    setError("")

    // Validate dates before calling the API — Claude cannot generate a sensible
    // itinerary for a zero-length or reversed date range
    if (!startDate || !endDate) {
      setError("Please select a start and end date.")
      return
    }
    if (endDate <= startDate) {
      setError("End date must be after start date.")
      return
    }

    setLoading(true)

    // Check if the user is logged in before calling the AI — the generate API
    // requires auth so the itinerary can be attributed to a user when saved.
    // If not logged in, redirect to login and return here after.
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/login?redirect=/")
      setLoading(false)
      return
    }

    // Fold the budget tier into the description so Claude can factor it in
    // when choosing activities, restaurants, and accommodations.
    const budgetNote = `Budget: ${budgetTiers[budgetTier].label} (${budgetTiers[budgetTier].range})`
    const enrichedDescription = [description.trim(), budgetNote].filter(Boolean).join(". ")

    try {
      const res = await fetch("/api/ai/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: destination,
          startDate,
          endDate,
          numTravelers: travelers,
          description: enrichedDescription,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }

      // Store the generated itinerary + form metadata in sessionStorage so
      // the /ai-template page can read it without a round-trip to the database.
      // Nothing is saved to Supabase until the user clicks "Save to My Trips".
      sessionStorage.setItem("travelbee_draft", JSON.stringify({
        itinerary: data.itinerary,
        location: destination,
        startDate,
        endDate,
        numTravelers: travelers,
        description: enrichedDescription,
      }))

      router.push("/ai-template")
    } catch {
      setError("A network error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const labelCls = "block text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-1.5"
  const iconCls = "text-sm opacity-50 shrink-0"

  return (
    <div className="w-full bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

      {/* Row 1: Destination + Travelers */}
      <div className="flex border-b border-gray-100">
        <div className="flex-[3] p-4 px-6 border-r border-gray-100">
          <span className={labelCls}>Destination</span>
          <div className="flex items-center gap-2">
            <span className={iconCls}>📍</span>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Where are you headed?"
              className="flex-1 bg-transparent outline-none text-[15px] text-gray-900 placeholder:text-gray-300"
            />
          </div>
        </div>
        <div className="flex-1 p-4 px-6">
          <span className={labelCls}>Travelers</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTravelers(t => Math.max(1, t - 1))}
              className="w-6 h-6 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors"
            >−</button>
            <span className="text-base font-medium w-5 text-center text-gray-900">{travelers}</span>
            <button
              onClick={() => setTravelers(t => Math.min(8, t + 1))}
              className="w-6 h-6 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors"
            >+</button>
          </div>
        </div>
      </div>

      {/* Row 2: Start / End / Duration */}
      <div className="flex border-b border-gray-100">
        <div className="flex-[5] p-4 px-6 border-r border-gray-100">
          <span className={labelCls}>Start date</span>
          <div className="flex items-center gap-2">
            <span className={iconCls}>🗓</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent outline-none text-[15px] text-gray-900 w-full"
            />
          </div>
        </div>
        <div className="flex-[5] p-4 px-6 border-r border-gray-100">
          <span className={labelCls}>End date</span>
          <div className="flex items-center gap-2">
            <span className={iconCls}>🗓</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent outline-none text-[15px] text-gray-900 w-full"
            />
          </div>
        </div>
        <div className="flex-[3] p-4 px-6 flex flex-col items-center justify-center text-center">
          <span className={labelCls}>Duration</span>
          <div className="flex items-center justify-center gap-2">
            <span className={iconCls}>⏱</span>
            <span className={`text-[15px] font-medium ${nights ? "text-[#d4a800]" : "text-gray-300"}`}>
              {nights ? `${nights} night${nights !== 1 ? "s" : ""}` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="p-4 px-6 border-b border-gray-100">
        <span className={labelCls}>Budget per person / trip</span>
        <div className="flex gap-3 mt-2">
          {budgetTiers.map((tier, i) => (
            <button
              key={tier.label}
              onClick={() => setBudgetTier(i)}
              className={`flex-1 border rounded-xl py-3 flex flex-col items-center gap-0.5 transition-colors
                ${budgetTier === i
                  ? "border-[#f5c300] bg-[#fffbeb]"
                  : "border-gray-100 hover:border-[#f5c300] hover:bg-[#fffdf0]"
                }`}
            >
              <span className={`text-[15px] font-medium tracking-wide ${budgetTier === i ? "text-[#b8860b]" : "text-gray-400"}`}>
                {tier.signs}
              </span>
              <span className={`text-[11px] font-medium ${budgetTier === i ? "text-[#b8860b]" : "text-gray-400"}`}>
                {tier.label}
              </span>
              <span className={`text-[10px] ${budgetTier === i ? "text-[#b8860b] opacity-80" : "text-gray-300"}`}>
                {tier.range}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Trip vibe */}
      <div className="p-4 px-6 border-b border-gray-100">
        <span className={labelCls}>Trip vibe &amp; wishes</span>
        <div className="flex items-start gap-2">
          <span className="text-sm opacity-50 mt-0.5">✨</span>
          <textarea
            ref={taRef}
            value={description}
            onChange={e => setDescription(e.target.value)}
            onInput={() => {
              if (taRef.current) {
                taRef.current.style.height = "auto"
                taRef.current.style.height = taRef.current.scrollHeight + "px"
              }
            }}
            placeholder="e.g. Relaxing beach trip with some hiking, great local food, and a rooftop bar or two…"
            rows={2}
            className="flex-1 bg-transparent outline-none resize-none overflow-hidden text-[15px] text-gray-900 placeholder:text-gray-300 leading-relaxed"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 px-6 gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[13px] text-gray-400">
            🐝 <strong className="text-gray-500 font-medium">Agent Atlas</strong> will craft your itinerary in seconds
          </p>
          {/* Error message shown inline if generation fails */}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <button
          onClick={handlePlan}
          disabled={!destination.trim() || loading}
          className="flex items-center gap-2 bg-[#f5c300] disabled:opacity-40 hover:bg-[#d4a800] text-[#3d3000] font-medium text-sm px-7 py-3 rounded-xl transition-colors whitespace-nowrap flex-shrink-0"
        >
          {loading ? (
            <>
              {/* Spinner while Claude is generating */}
              <span className="w-4 h-4 border-2 border-[#3d3000] border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>✈ Plan my trip</>
          )}
        </button>
      </div>

    </div>
  )
}