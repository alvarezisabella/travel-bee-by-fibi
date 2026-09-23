"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react"

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
  {
    band: "rgba(234,179,8,0.28)",
    dot: "#d97706",
    border: "rgba(234,179,8,0.70)",
    bg: "rgba(234,179,8,0.12)",
  },
  {
    band: "rgba(59,130,246,0.22)",
    dot: "#2563eb",
    border: "rgba(59,130,246,0.65)",
    bg: "rgba(59,130,246,0.10)",
  },
  {
    band: "rgba(16,185,129,0.22)",
    dot: "#059669",
    border: "rgba(16,185,129,0.65)",
    bg: "rgba(16,185,129,0.10)",
  },
  {
    band: "rgba(239,68,68,0.22)",
    dot: "#dc2626",
    border: "rgba(239,68,68,0.65)",
    bg: "rgba(239,68,68,0.10)",
  },
  {
    band: "rgba(168,85,247,0.22)",
    dot: "#9333ea",
    border: "rgba(168,85,247,0.65)",
    bg: "rgba(168,85,247,0.10)",
  },
  {
    band: "rgba(236,72,153,0.22)",
    dot: "#db2777",
    border: "rgba(236,72,153,0.65)",
    bg: "rgba(236,72,153,0.10)",
  },
  {
    band: "rgba(14,165,233,0.22)",
    dot: "#0ea5e9",
    border: "rgba(14,165,233,0.65)",
    bg: "rgba(14,165,233,0.10)",
  },
]

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function parseDate(iso?: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function fmtDate(iso?: string) {
  if (!iso) return "—"

  const d = parseDate(iso)
  if (!d) return "—"

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function normalized(d: Date) {
  const n = new Date(d)
  n.setHours(0, 0, 0, 0)
  return n
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

    let colStart = -1
    let colEnd = -1

    week.forEach((d, col) => {
      const dn = normalized(d)

      if (dn >= sd && dn <= ed) {
        if (colStart === -1) colStart = col
        colEnd = col
      }
    })

    if (colStart === -1) return []

    return [
      {
        tripIdx: ti,
        colStart,
        colEnd,
        roundLeft: sameDay(normalized(week[colStart]), sd),
        roundRight: sameDay(normalized(week[colEnd]), ed),
      },
    ]
  })
}

function CalendarGrid({
  year,
  month,
  trips,
  mini = false,
  selectedTripIdx,
  onSelectTrip,
}: {
  year: number
  month: number
  trips: TripSummary[]
  mini?: boolean
  selectedTripIdx: number | null
  onSelectTrip: (idx: number | null) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const cellH = mini ? 28 : 40

  const [tooltip, setTooltip] = useState<{
    label: string
    x: number
    y: number
  } | null>(null)

  const cells: Date[] = []

  for (let i = first.getDay() - 1; i >= 0; i--) {
    const d = new Date(first)
    d.setDate(d.getDate() - i - 1)
    cells.push(d)
  }

  for (let i = 1; i <= last.getDate(); i++) {
    cells.push(new Date(year, month, i))
  }

  for (let i = 1; i <= 6 - last.getDay(); i++) {
    const d = new Date(last)
    d.setDate(d.getDate() + i)
    cells.push(d)
  }

  const weeks: Date[][] = []

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div className="relative w-full select-none">
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y - 36,
            transform: "translateX(-50%)",
            background: "#1f2937",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 6,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 99999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          {tooltip.label}
        </div>
      )}

      <div className="mb-1 grid grid-cols-7">
        {DAYS.map((d) => (
          <div
            key={d}
            style={{ fontSize: mini ? 10 : 11 }}
            className="py-1 text-center font-medium text-gray-400"
          >
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const bands = getBandsForWeek(week, trips)

        return (
          <div key={wi} className="relative" style={{ height: cellH }}>
            {bands.map((band) => {
              const color = TRIP_COLORS[band.tripIdx % TRIP_COLORS.length]
              const bandH = mini ? 18 : 26
              const isSelected = selectedTripIdx === band.tripIdx
              const isDimmed = selectedTripIdx !== null && !isSelected
              const rLeft = band.roundLeft ? "999px" : "0"
              const rRight = band.roundRight ? "999px" : "0"

              return (
                <div
                  key={band.tripIdx}
                  onClick={
                    !mini
                      ? (e) => {
                          e.stopPropagation()
                          onSelectTrip(isSelected ? null : band.tripIdx)
                          setTooltip(null)
                        }
                      : undefined
                  }
                  onMouseEnter={(e) =>
                    setTooltip({
                      label: trips[band.tripIdx].title,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseMove={(e) =>
                    setTooltip((t) =>
                      t ? { ...t, x: e.clientX, y: e.clientY } : null
                    )
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    position: "absolute",
                    top: (cellH - bandH) / 2,
                    height: bandH,
                    left: `${(band.colStart / 7) * 100}%`,
                    width: `${
                      ((band.colEnd - band.colStart + 1) / 7) * 100
                    }%`,
                    background: color.band,
                    borderRadius: `${rLeft} ${rRight} ${rRight} ${rLeft}`,
                    cursor: mini ? "default" : "pointer",
                    zIndex: 5,
                    opacity: isDimmed ? 0.3 : 1,
                    outline: isSelected && !mini ? `2px solid ${color.dot}` : "none",
                    transition: "opacity 0.15s, outline 0.15s",
                  }}
                />
              )
            })}

            <div
              className="absolute inset-0 grid h-full grid-cols-7"
              style={{ zIndex: 6, pointerEvents: "none" }}
            >
              {week.map((date, col) => {
                const isCurrentMonth = date.getMonth() === month
                const isToday = sameDay(normalized(date), today)
                const inAnyTrip = bands.some(
                  (b) => col >= b.colStart && col <= b.colEnd
                )

                return (
                  <div
                    key={col}
                    className="flex h-full items-center justify-center"
                    style={{ opacity: isCurrentMonth ? 1 : 0.25 }}
                  >
                    <span
                      className="flex items-center justify-center rounded-full font-medium"
                      style={{
                        width: mini ? 22 : 28,
                        height: mini ? 22 : 28,
                        fontSize: mini ? 11 : 12,
                        background: isToday ? "#f59e0b" : "transparent",
                        color: isToday
                          ? "#fff"
                          : inAnyTrip
                            ? "#1f2937"
                            : "#6b7280",
                        fontWeight: inAnyTrip ? 600 : 400,
                      }}
                    >
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

export default function UpcomingTripsCalendar({ trips }: Props) {
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [open, setOpen] = useState(false)
  const [selectedTripIdx, setSelectedTripIdx] = useState<number | null>(null)

  const datedTrips = trips.filter((t) => !!parseDate(t.startDate))

  const prev = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const next = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false)
      setSelectedTripIdx(null)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKey)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [open, handleKey])

  useEffect(() => {
    setSelectedTripIdx(null)
  }, [open, month])

  const tripsThisMonth = datedTrips.filter((t) => {
    const s = parseDate(t.startDate)!
    const e = parseDate(t.endDate) ?? s
    const sd = normalized(s)
    const ed = normalized(e)
    const ms = new Date(year, month, 1)
    const me = new Date(year, month + 1, 0)

    ms.setHours(0, 0, 0, 0)
    me.setHours(23, 59, 59, 999)

    return sd <= me && ed >= ms
  })

  const monthTrips = [...tripsThisMonth].sort(
    (a, b) =>
      parseDate(a.startDate)!.getTime() - parseDate(b.startDate)!.getTime()
  )

  const displayTrips =
    selectedTripIdx !== null
      ? datedTrips.filter((_, i) => i === selectedTripIdx)
      : monthTrips

  return (
    <>
      <div className="select-none">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="text-xs font-medium text-gray-600">
            {MONTHS[month]} {year}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <CalendarGrid
          year={year}
          month={month}
          trips={datedTrips}
          mini
          selectedTripIdx={null}
          onSelectTrip={() => {}}
        />

        {tripsThisMonth.length > 0 && (
          <div className="mt-3 space-y-1">
            {tripsThisMonth.map((t) => {
              const ri = datedTrips.indexOf(t)
              const color = TRIP_COLORS[ri % TRIP_COLORS.length]

              return (
                <div key={t.id} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-sm"
                    style={{ background: color.dot }}
                  />
                  <span className="truncate text-[10px] text-gray-500">
                    {t.title}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setOpen(true)}
          className="mt-2 w-full text-center text-[10px] text-gray-400 transition-colors hover:text-gray-600"
        >
          Click to expand
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4"
          style={{
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => {
            setOpen(false)
            setSelectedTripIdx(null)
          }}
        >
          <div
            className="max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-gray-800">
                Upcoming Trips
              </h2>

              <button
                onClick={() => {
                  setOpen(false)
                  setSelectedTripIdx(null)
                }}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
                aria-label="Close calendar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex max-h-[calc(92vh-64px)] flex-col gap-5 overflow-y-auto p-4 sm:gap-6 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={prev}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <ChevronLeft size={14} />
                  <span className="hidden xs:inline">Prev</span>
                </button>

                <span className="text-sm font-semibold text-gray-700">
                  {MONTHS[month]} {year}
                </span>

                <button
                  onClick={next}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <span className="hidden xs:inline">Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <CalendarGrid
                year={year}
                month={month}
                trips={datedTrips}
                selectedTripIdx={selectedTripIdx}
                onSelectTrip={setSelectedTripIdx}
              />

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {selectedTripIdx !== null
                    ? "Selected Trip"
                    : "Trips This Month"}
                </h3>

                {selectedTripIdx !== null && (
                  <button
                    onClick={() => setSelectedTripIdx(null)}
                    className="text-[11px] text-gray-400 underline transition-colors hover:text-gray-600"
                  >
                    Show all
                  </button>
                )}
              </div>

              {displayTrips.length > 0 ? (
                <div
                  className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#e5e7eb transparent",
                  }}
                >
                  {displayTrips.map((t) => {
                    const i = datedTrips.indexOf(t)
                    const color = TRIP_COLORS[i % TRIP_COLORS.length]

                    return (
                      <div
                        key={t.id}
                        className="relative flex w-56 flex-shrink-0 snap-start flex-col gap-1.5 rounded-xl border p-3 transition-all sm:w-44"
                        style={{
                          borderColor: color.border,
                          background: color.bg,
                        }}
                      >
                        <a
                          href={`/itinerary/${t.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-2 rounded-md p-1 text-gray-400 transition-colors hover:bg-black/10 hover:text-gray-700"
                          aria-label="Open itinerary"
                        >
                          <ExternalLink size={11} />
                        </a>

                        <div className="flex items-center gap-2 pr-5">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                            style={{ background: color.dot }}
                          />
                          <p className="truncate text-xs font-semibold text-gray-800">
                            {t.title}
                          </p>
                        </div>

                        {t.location && (
                          <p className="flex items-center gap-1 truncate text-[10px] text-gray-500">
                            <MapPin size={9} />
                            {t.location}
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
                <p className="py-2 text-center text-sm text-gray-400">
                  No trips this month.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}