"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, MapPin } from "lucide-react"
import { WORLD_LOCATIONS } from "@/app/itinerary/data/worldLocations"

const budgetTiers = [
  { label: "Budget",    range: "Under $500"    },
  { label: "Mid-range", range: "$500 – $2,000" },
  { label: "Luxury",    range: "$2,000+"       },
]

export default function TripSearchForm() {
  const router = useRouter()
  const [destination, setDestination] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [travelers, setTravelers] = useState(2)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budgetTier, setBudgetTier] = useState(0)
  const [description, setDescription] = useState("")
  const [nights, setNights] = useState<number | null>(7)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const destRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = destination.trim().length === 0
    ? []
    : WORLD_LOCATIONS.filter(loc =>
        loc.toLowerCase().includes(destination.toLowerCase())
      ).slice(0, 8)

  function handleSelect(loc: string) {
    setDestination(loc)
    setDropdownOpen(false)
  }

  function handlePlan() {
    if (!destination.trim()) return
    const params = new URLSearchParams({
      destination,
      travelers: String(travelers),
      startDate,
      endDate,
      budget: budgetTiers[budgetTier].label,
      description,
    })
    router.push(`/plan?${params.toString()}`)
  }

  const labelCls = "block text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-1.5"
  const iconCls = "text-sm opacity-50 shrink-0"

  return (
    <div className="w-full bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

      {/* Row 1: Destination + Travelers */}
      <div className="flex border-b border-gray-100">

        {/* Destination with dropdown */}
        <div className="flex-[3] p-4 px-6 border-r border-gray-100 relative" ref={destRef}>
          <span className={labelCls}>Destination</span>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="opacity-50 shrink-0 text-gray-500" />
            <input
              type="text"
              value={destination}
              onChange={e => { setDestination(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={e => {
                if (e.key === "Escape") setDropdownOpen(false)
                if (e.key === "Enter" && filtered.length > 0) handleSelect(filtered[0])
              }}
              placeholder="Where are you headed?"
              className="flex-1 bg-transparent outline-none text-[15px] text-gray-900 placeholder:text-gray-300"
            />
            {destination && (
              <button
                onClick={() => { setDestination(""); setDropdownOpen(false) }}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {dropdownOpen && filtered.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 mx-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {filtered.map(loc => {
                const parts = loc.split(", ")
                const city = parts[0]
                const country = parts.slice(1).join(", ")
                return (
                  <li key={loc}>
                    <button
                      onClick={() => handleSelect(loc)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-yellow-50 transition-colors"
                    >
                      <MapPin size={13} className="text-yellow-500 shrink-0" />
                      <span className="text-[14px] text-gray-800">{city}</span>
                      {country && (
                        <span className="text-[12px] text-gray-400 ml-auto">{country}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* No results */}
          {dropdownOpen && destination.trim().length > 0 && filtered.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 mx-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 px-4 py-3">
              <p className="text-[13px] text-gray-400">
                No matches — press <span className="font-medium text-gray-600">Enter</span> to use{" "}
                <span className="font-medium text-gray-700">"{destination}"</span>
              </p>
            </div>
          )}
        </div>

        {/* Travelers — centered */}
        <div className="flex-1 p-4 px-6 flex flex-col items-center justify-center text-center">
          <span className={labelCls}>Travelers</span>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setTravelers(t => Math.max(1, t - 1))}
              disabled={travelers <= 1}
              className="w-6 h-6 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >−</button>
            <span className="text-base font-medium w-5 text-center text-gray-900">{travelers >= 8 ? "8+" : travelers}</span>
            <button
              onClick={() => setTravelers(t => Math.min(8, t + 1))}
              disabled={travelers >= 8}
              className="w-6 h-6 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >+</button>
          </div>
        </div>
      </div>

      {/* Row 2: Start / End / Duration */}
      <div className="flex border-b border-gray-100">
        <div className="flex-[5] p-4 px-6 border-r border-gray-100 flex flex-col items-center justify-center text-center">
          <span className={labelCls}>Start date</span>
          <div className="flex items-center justify-center gap-2">
            <span className={iconCls}>🗓</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent outline-none text-[15px] text-gray-900"
            />
          </div>
        </div>
        <div className="flex-[5] p-4 px-6 border-r border-gray-100 flex flex-col items-center justify-center text-center">
          <span className={labelCls}>End date</span>
          <div className="flex items-center justify-center gap-2">
            <span className={iconCls}>🗓</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent outline-none text-[15px] text-gray-900"
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
              className={`flex-1 border rounded-xl py-3.5 flex flex-col items-center gap-1 transition-colors ${
                budgetTier === i
                  ? "border-[#F5C300] bg-[#fffbeb]"
                  : "border-gray-100 hover:border-[#F5C300] hover:bg-[#fffdf0]"
              }`}
            >
              <span className={`text-[14px] font-medium ${budgetTier === i ? "text-[#92600a]" : "text-gray-500"}`}>
                {tier.label}
              </span>
              <span className={`text-[11px] ${budgetTier === i ? "text-[#b8860b]" : "text-gray-400"}`}>
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
      <div className="flex items-center justify-between p-4 px-6">
        <p className="text-[13px] text-gray-400">
          🐝 <strong className="text-gray-500 font-medium">Agent Atlas</strong> will craft your itinerary in seconds
        </p>
        <button
          onClick={handlePlan}
          disabled={!destination.trim()}
          className="flex items-center gap-2 bg-[#F5C300] disabled:opacity-40 hover:bg-[#d4a800] text-[#3d3000] font-medium text-sm px-7 py-3 rounded-xl transition-colors whitespace-nowrap"
        >
          ✈ Plan my trip
        </button>
      </div>

    </div>
  )
}