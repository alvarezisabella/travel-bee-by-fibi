"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, X, MapPin, Calendar } from "lucide-react"

interface TripSummary {
  id: string
  title: string
  location?: string
  startDate?: string
  endDate?: string
  coverPhoto?: string
}

interface Props {
  trips: TripSummary[]
}

const TRIP_COLORS = [
  { band: "rgba(234,179,8,0.28)",   dot: "#d97706", border: "rgba(234,179,8,0.70)",  bg: "rgba(234,179,8,0.12)"  },
  { band: "rgba(59,130,246,0.22)",  dot: "#2563eb", border: "rgba(59,130,246,0.65)", bg: "rgba(59,130,246,0.10)" },
  { band: "rgba(16,185,129,0.22)",  dot: "#059669", border: "rgba(16,185,129,0.65)", bg: "rgba(16,185,129,0.10)" },
  { band: "rgba(239,68,68,0.22)",   dot: "#dc2626", border: "rgba(239,68,68,0.65)",  bg: "rgba(239,68,68,0.10)"  },
  { band: "rgba(168,85,247,0.22)",  dot: "#9333ea", border: "rgba(168,85,247,0.65)", bg: "rgba(168,85,247,0.10)" },
  { band: "rgba(236,72,153,0.22)",  dot: "#db2777", border: "rgba(236,72,153,0.65)", bg: "rgba(236,72,153,0.10)" },
  { band: "rgba(14,165,233,0.22)",  dot: "#0ea5e9", border: "rgba(14,165,233,0.65)", bg: "rgba(14,165,233,0.10)" },
]

const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function parseDate(iso?: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function fmtDate(iso?: string) {
  if (!iso) return "—"
  const d = parseDate(iso)
  if (!d) return "—"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function normalized(d: Date) {
  const n = new Date(d); n.setHours(0,0,0,0); return n
}

type BandInfo = {
  tripIdx: number
  colStart: number
  colEnd: number
  roundLeft: boolean
  roundRight: boolean
}

function getBandsForWeek(week: Date[], trips: TripSummary[]): BandInfo[] {
  return trips.flatMap((trip, ti) => {
    const s = parseDate(trip.startDate)
    if (!s) return []
    const e = parseDate(trip.endDate) ?? s
    const sd = normalized(s)
    const ed = normalized(e)
    let colStart = -1, colEnd = -1
    week.forEach((d, col) => {
      const dn = normalized(d)
      if (dn >= sd && dn <= ed) {
        if (colStart === -1) colStart = col
        colEnd = col
      }
    })
    if (colStart === -1) return []
    return [{
      tripIdx: ti, colStart, colEnd,
      roundLeft:  sameDay(normalized(week[colStart]), sd),
      roundRight: sameDay(normalized(week[colEnd]),   ed),
    }]
  })
}

// ── CalendarGrid ──────────────────────────────────────────────────────────────
function CalendarGrid({ year, month, trips, mini = false, selectedTripIdx, onSelectTrip }: {
  year: number
  month: number
  trips: TripSummary[]
  mini?: boolean
  selectedTripIdx: number | null
  onSelectTrip: (idx: number | null) => void
}) {
  const today   = new Date(); today.setHours(0,0,0,0)
  const first   = new Date(year, month, 1)
  const last    = new Date(year, month + 1, 0)
  const cellH   = mini ? 28 : 38

  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null)

  const cells: Date[] = []
  for (let i = first.getDay() - 1; i >= 0; i--) {
    const d = new Date(first); d.setDate(d.getDate() - i - 1); cells.push(d)
  }
  for (let i = 1; i <= last.getDate(); i++) cells.push(new Date(year, month, i))
  for (let i = 1; i <= 6 - last.getDay(); i++) {
    const d = new Date(last); d.setDate(d.getDate() + i); cells.push(d)
  }

  const weeks: Date[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="w-full select-none" style={{ position: "relative" }}>
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x, top: tooltip.y - 36,
          transform: "translateX(-50%)", background: "#1f2937", color: "#fff",
          fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 6,
          pointerEvents: "none", whiteSpace: "nowrap", zIndex: 99999,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}>
          {tooltip.label}
        </div>
      )}

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} style={{ fontSize: mini ? 10 : 11 }}
            className="text-center font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const bands = getBandsForWeek(week, trips)
        return (
          <div key={wi} className="relative" style={{ height: cellH }}>
            {bands.map((band) => {
              const color   = TRIP_COLORS[band.tripIdx % TRIP_COLORS.length]
              const BAND_H  = mini ? 18 : 26
              const isSelected = selectedTripIdx === band.tripIdx
              const isDimmed   = selectedTripIdx !== null && !isSelected
              const rLeft  = band.roundLeft  ? "999px" : "0"
              const rRight = band.roundRight ? "999px" : "0"
              return (
                <div
                  key={band.tripIdx}
                  onClick={!mini ? (e) => {
                    e.stopPropagation()
                    onSelectTrip(isSelected ? null : band.tripIdx)
                    setTooltip(null)
                  } : undefined}
                  onMouseEnter={e => setTooltip({ label: trips[band.tripIdx].title, x: e.clientX, y: e.clientY })}
                  onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    position:     "absolute",
                    top:          (cellH - BAND_H) / 2,
                    height:       BAND_H,
                    left:         `${(band.colStart / 7) * 100}%`,
                    width:        `${((band.colEnd - band.colStart + 1) / 7) * 100}%`,
                    background:   color.band,
                    borderRadius: `${rLeft} ${rRight} ${rRight} ${rLeft}`,
                    cursor:       mini ? "default" : "pointer",
                    zIndex:       5,
                    opacity:      isDimmed ? 0.3 : 1,
                    outline:      isSelected && !mini ? `2px solid ${color.dot}` : "none",
                    transition:   "opacity 0.15s, outline 0.15s",
                  }}
                />
              )
            })}

            <div className="grid grid-cols-7 h-full absolute inset-0" style={{ zIndex: 6, pointerEvents: "none" }}>
              {week.map((date, col) => {
                const isCurrentMonth = date.getMonth() === month
                const isToday        = sameDay(normalized(date), today)
                const inAnyTrip      = bands.some(b => col >= b.colStart && col <= b.colEnd)
                return (
                  <div key={col} className="flex items-center justify-center h-full"
                    style={{ opacity: isCurrentMonth ? 1 : 0.25 }}>
                    <span className="flex items-center justify-center rounded-full font-medium"
                      style={{
                        width: mini ? 22 : 28, height: mini ? 22 : 28, fontSize: mini ? 11 : 12,
                        background: isToday ? "#f59e0b" : "transparent",
                        color: isToday ? "#fff" : inAnyTrip ? "#1f2937" : "#6b7280",
                        fontWeight: inAnyTrip ? 600 : 400,
                      }}>
                      {date.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function UpcomingTripsCalendar({ trips }: Props) {
  const now = new Date()
  const [year,  setYear]       = useState(now.getFullYear())
  const [month, setMonth]      = useState(now.getMonth())
  const [open,  setOpen]       = useState(false)
  const [selectedTripIdx, setSelectedTripIdx] = useState<number | null>(null)

  const datedTrips = trips.filter(t => !!parseDate(t.startDate))

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setSelectedTripIdx(null) }
  }, [])
  useEffect(() => {
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, handleKey])

  // Reset selection and card index when modal closes or month changes
  useEffect(() => { setSelectedTripIdx(null); setCardIdx(0) }, [open, month])

  const tripsThisMonth = datedTrips.filter(t => {
    const s = parseDate(t.startDate)!
    const e = parseDate(t.endDate) ?? s
    const sd = normalized(s), ed = normalized(e)
    const ms = new Date(year, month, 1); ms.setHours(0,0,0,0)
    const me = new Date(year, month + 1, 0); me.setHours(23,59,59,999)
    return sd <= me && ed >= ms
  })

  // Trips to show in the card list: filtered to current month, sorted by start date
  const monthTrips = [...tripsThisMonth].sort((a, b) => parseDate(a.startDate)!.getTime() - parseDate(b.startDate)!.getTime())
  const displayTrips = selectedTripIdx !== null
    ? datedTrips.filter((_, i) => i === selectedTripIdx)
    : monthTrips

  // Carousel state for trip cards
  const [cardIdx, setCardIdx] = useState(0)
  const visibleCard = displayTrips[cardIdx] ?? null

  return (
    <>
      {/* Mini calendar */}
      <div className="select-none">
        <div className="flex items-center justify-between mb-2">
          <button onClick={e => { e.stopPropagation(); prev() }}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-gray-600">{MONTHS[month]} {year}</span>
          <button onClick={e => { e.stopPropagation(); next() }}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
        <CalendarGrid year={year} month={month} trips={datedTrips} mini
          selectedTripIdx={null} onSelectTrip={() => {}} />
        {tripsThisMonth.length > 0 && (
          <div className="mt-3 space-y-1">
            {tripsThisMonth.map(t => {
              const ri = datedTrips.indexOf(t)
              const color = TRIP_COLORS[ri % TRIP_COLORS.length]
              return (
                <div key={t.id} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color.dot }} />
                  <span className="text-[10px] text-gray-500 truncate">{t.title}</span>
                </div>
              )
            })}
          </div>
        )}
        <p onClick={() => setOpen(true)} className="text-[10px] text-gray-400 hover:text-gray-600 text-center mt-2 cursor-pointer transition-colors">Click to expand</p>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => { setOpen(false); setSelectedTripIdx(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Upcoming Trips</h2>
              <button onClick={() => { setOpen(false); setSelectedTripIdx(null) }}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <button onClick={prev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 transition-colors">
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-sm font-semibold text-gray-700">{MONTHS[month]} {year}</span>
                <button onClick={next}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 transition-colors">
                  Next <ChevronRight size={14} />
                </button>
              </div>

              <CalendarGrid year={year} month={month} trips={datedTrips}
                selectedTripIdx={selectedTripIdx} onSelectTrip={setSelectedTripIdx} />

              {/* Trip label + carousel nav */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {selectedTripIdx !== null ? "Selected Trip" : "Trips This Month"}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedTripIdx !== null && (
                    <button onClick={() => { setSelectedTripIdx(null); setCardIdx(0) }}
                      className="text-[11px] text-gray-400 hover:text-gray-600 underline transition-colors mr-2">
                      Show all
                    </button>
                  )}
                  {displayTrips.length > 3 && (
                    <>
                      <button
                        onClick={() => setCardIdx(i => Math.max(0, i - 3))}
                        disabled={cardIdx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-25 transition-colors">
                        <ChevronLeft size={12} />
                      </button>
                      <span className="text-[11px] text-gray-400">
                        {Math.floor(cardIdx / 3) + 1} / {Math.ceil(displayTrips.length / 3)}
                      </span>
                      <button
                        onClick={() => setCardIdx(i => Math.min(displayTrips.length - 1, i + 3))}
                        disabled={cardIdx + 3 >= displayTrips.length}
                        className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-25 transition-colors">
                        <ChevronRight size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Trip card carousel — 3 at a time */}
              {displayTrips.length > 0 ? (
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(displayTrips.slice(cardIdx, cardIdx + 3).length, 3)}, 1fr)` }}>
                  {displayTrips.slice(cardIdx, cardIdx + 3).map((t) => {
                    const i = datedTrips.indexOf(t)
                    const color = TRIP_COLORS[i % TRIP_COLORS.length]
                    return (
                      <div key={t.id} className="flex flex-col gap-1.5 p-3 rounded-xl border transition-all"
                        style={{ borderColor: color.border, background: color.bg }}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color.dot }} />
                          <p className="text-xs font-semibold text-gray-800 truncate">{t.title}</p>
                        </div>
                        {t.location && (
                          <p className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                            <MapPin size={9} /> {t.location}
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Calendar size={9} />
                          {`${fmtDate(t.startDate)} → ${fmtDate(t.endDate)}`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">No trips this month.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}