"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plane, Utensils, CalendarCheck, Zap } from "lucide-react"
import { Event, LABEL_MAP, Traveler } from "../types/types"
import AddEvent from "../add_event"

interface DayWithDate {
  id: string      // day counter, e.g. "1"
  date: string    // ISO date string, e.g. "2024-06-15"
  events: Event[]
}

interface CalendarGridProps {
  days: DayWithDate[]
  tripId: string
  members: Traveler[]
}

const START_HOUR = 6
const END_HOUR = 23
const HOUR_HEIGHT = 64
const TIME_COL_WIDTH = 52
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

function formatHour(hour: number) {
  if (hour === 0) return "12AM"
  if (hour < 12) return `${hour}AM`
  if (hour === 12) return "12PM"
  return `${hour - 12}PM`
}

function formatDayHeader(date: string) {
  const d = new Date(date + "T00:00:00")
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    day: d.getDate(),
  }
}

function isToday(date: string) {
  const today = new Date()
  const d = new Date(date + "T00:00:00")
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

function getTypeIcon(type: string) {
  const cls = "shrink-0"
  switch (type) {
    case "Transit":     return <Plane size={9} className={cls} />
    case "Food":        return <Utensils size={9} className={cls} />
    case "Reservation": return <CalendarCheck size={9} className={cls} />
    case "Activity":    return <Zap size={9} className={cls} />
    default:            return null
  }
}

interface PositionedEvent {
  event: Event
  top: number
  height: number
  leftPct: number
  widthPct: number
}

function getEventPos(event: Event): { top: number; height: number } | null {
  if (!event.startTime) return null
  const [h, m] = event.startTime.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return null

  const startMin = h * 60 + m
  const endMin = startMin + Math.max(event.duration || 0, 15)
  const gridStart = START_HOUR * 60
  const gridEnd = END_HOUR * 60

  if (endMin <= gridStart || startMin >= gridEnd) return null

  const clampedStart = Math.max(startMin, gridStart)
  const clampedEnd = Math.min(endMin, gridEnd)

  return {
    top: ((clampedStart - gridStart) / 60) * HOUR_HEIGHT,
    height: Math.max(((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT, 22),
  }
}

function layoutEvents(events: Event[]): PositionedEvent[] {
  const timed: Array<{ event: Event; top: number; height: number }> = []
  for (const ev of events) {
    const pos = getEventPos(ev)
    if (pos) timed.push({ event: ev, ...pos })
  }
  timed.sort((a, b) => a.top - b.top)

  const colEnds: number[] = []
  const colAssign: number[] = []

  for (const ev of timed) {
    let col = colEnds.findIndex((end) => end <= ev.top + 1)
    if (col === -1) col = colEnds.length
    colAssign.push(col)
    colEnds[col] = ev.top + ev.height
  }

  return timed.map(({ event, top, height }, i) => {
    const myCol = colAssign[i]
    let maxCol = 0
    for (let j = 0; j < timed.length; j++) {
      const o = timed[j]
      if (o.top < top + height && o.top + o.height > top) {
        maxCol = Math.max(maxCol, colAssign[j])
      }
    }
    const numCols = maxCol + 1
    return {
      event,
      top,
      height,
      leftPct: (myCol / numCols) * 100,
      widthPct: (1 / numCols) * 100,
    }
  })
}

interface AddModal {
  dayId: string
  date: string
  startTime: string
}

export default function CalendarGrid({ days, tripId, members }: CalendarGridProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(new Date())
  const [addModal, setAddModal] = useState<AddModal | null>(null)
  const [popover, setPopover] = useState<Event | null>(null)
  const [localEvents, setLocalEvents] = useState<Record<string, Event[]>>({})
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // When server data refreshes, drop any localEvents now present in days
  useEffect(() => {
    setLocalEvents(prev => {
      const next: Record<string, Event[]> = {}
      for (const [dayId, events] of Object.entries(prev)) {
        const serverIds = new Set(days.find(d => d.id === dayId)?.events.map(e => e.id) ?? [])
        const stillLocal = events.filter(e => !serverIds.has(e.id))
        if (stillLocal.length > 0) next[dayId] = stillLocal
      }
      return next
    })
  }, [days])

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const nowMin = now.getHours() * 60 + now.getMinutes()
      const offset = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT - 120
      scrollRef.current.scrollTop = Math.max(0, offset)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tick every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowTop = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT
  const showNowLine = nowMin >= START_HOUR * 60 && nowMin < END_HOUR * 60

  const gridCols = `${TIME_COL_WIDTH}px repeat(${days.length}, minmax(120px, 1fr))`

  // Click on a time slot — snap to nearest 15 min
  const handleCellClick = (e: React.MouseEvent<HTMLDivElement>, day: DayWithDate) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rawMinutes = ((e.clientY - rect.top) / HOUR_HEIGHT) * 60 + START_HOUR * 60
    const snapped = Math.round(rawMinutes / 15) * 15
    const h = Math.min(Math.floor(snapped / 60), END_HOUR - 1)
    const m = snapped % 60
    const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    setAddModal({ dayId: day.id, date: day.date, startTime })
  }

  const handleEventAdded = (event: Event, dayId: string) => {
    setLocalEvents((prev) => ({
      ...prev,
      [dayId]: [...(prev[dayId] ?? []), event],
    }))
    router.refresh()
  }

  const handleDelete = async (eventId: string) => {
    const res = await fetch('/api/auth/event', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId }),
    })
    if (!res.ok) { console.error('Failed to delete event'); return }
    setDeletedIds((prev) => new Set(prev).add(eventId))
    router.refresh()
  }

  return (
    <>
      <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* STICKY DAY HEADERS */}
        <div
          className="grid border-b border-gray-100 bg-white sticky top-0 z-10"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="border-r border-gray-100" />
          {days.map((day) => {
            const { weekday, day: dayNum } = formatDayHeader(day.date)
            const today = isToday(day.date)
            return (
              <div
                key={day.id}
                className="py-3 text-center border-r border-gray-100 last:border-r-0"
              >
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    today ? "text-yellow-500" : "text-gray-400"
                  }`}
                >
                  {weekday}
                </div>
                <div
                  className={`mx-auto mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    today ? "bg-yellow-400 text-gray-900" : "text-gray-700"
                  }`}
                >
                  {dayNum}
                </div>
              </div>
            )
          })}
        </div>

        {/* SCROLLABLE BODY */}
        <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
          <div className="grid relative" style={{ gridTemplateColumns: gridCols }}>

            {/* TIME LABELS */}
            <div className="relative z-10">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="text-[11px] text-gray-400 text-right pr-3 select-none border-r border-gray-100"
                  style={{ height: HOUR_HEIGHT, paddingTop: 3 }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* DAY COLUMNS */}
            {days.map((day) => {
              const today = isToday(day.date)
              const serverIds = new Set(day.events.map(e => e.id))
              const allEvents = [
                ...day.events,
                ...(localEvents[day.id] ?? []).filter(e => !serverIds.has(e.id)),
              ].filter(e => !deletedIds.has(e.id))
              const laid = layoutEvents(allEvents)

              return (
                <div
                  key={day.id}
                  className={`relative border-r border-gray-100 last:border-r-0 cursor-crosshair ${
                    today ? "bg-yellow-50/30" : ""
                  }`}
                  style={{ height: HOURS.length * HOUR_HEIGHT }}
                  onClick={(e) => handleCellClick(e, day)}
                >
                  {/* Hour lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Half-hour lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={`h-${hour}`}
                      className="absolute left-0 right-0 border-t border-dashed border-gray-50"
                      style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    />
                  ))}

                  {/* Now line */}
                  {today && showNowLine && (
                    <div
                      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      style={{ top: nowTop }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-400 -ml-1 shrink-0" />
                      <div className="flex-1 h-px bg-red-400" />
                    </div>
                  )}

                  {/* Events */}
                  {laid.map(({ event, top, height, leftPct, widthPct }) => {
                    const colors = LABEL_MAP[event.type] ?? {
                      bg: "bg-gray-100",
                      bar: "bg-gray-400",
                      text: "text-gray-700",
                      time: "text-gray-500",
                    }
                    const isShort = height < 38

                    return (
                      <div
                        key={event.id}
                        className="absolute flex rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:brightness-95 transition-all"
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                        onClick={(e) => { e.stopPropagation(); setPopover(event) }}
                      >
                        {/* Color bar */}
                        <div className={`w-[3px] shrink-0 ${colors.bar}`} />

                        {/* Content */}
                        <div className={`group/chip flex-1 px-1.5 py-1 min-w-0 ${colors.bg} relative`}>
                          <div className={`flex items-center gap-1 ${colors.text}`}>
                            {getTypeIcon(event.type)}
                            <span className="font-semibold text-[11px] leading-tight truncate flex-1">
                              {event.title}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(event.id) }}
                              className="opacity-0 group-hover/chip:opacity-100 transition-opacity text-current hover:text-red-500 leading-none text-sm shrink-0"
                            >
                              ×
                            </button>
                          </div>
                          {!isShort && (
                            <div className={`text-[10px] mt-0.5 truncate ${colors.time}`}>
                              {event.startTime}
                              {event.location ? ` · ${event.location}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Empty state */}
                  {allEvents.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[11px] text-gray-200 select-none">No events</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* EVENT DETAIL POPOVER */}
      {popover && (() => {
        const colors = LABEL_MAP[popover.type] ?? { bg: "bg-gray-100", bar: "bg-gray-400", text: "text-gray-700", time: "text-gray-500" }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPopover(null)}>
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-80 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Color header bar */}
              <div className={`h-1.5 w-full ${colors.bar}`} />

              <div className="p-5 space-y-3">
                {/* Title + close */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-semibold text-base leading-tight ${colors.text}`}>{popover.title}</h3>
                  <button onClick={() => setPopover(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0">×</button>
                </div>

                {/* Type + status badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>{popover.type}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium text-white ${
                    popover.status === "Confirmed" ? "bg-[#98d99f]" :
                    popover.status === "Pending"   ? "bg-[#ffcd59] text-gray-700" :
                                                     "bg-[#9c8a8a]"
                  }`}>{popover.status}</span>
                </div>

                {/* Time */}
                {popover.startTime && (
                  <div className={`flex items-center gap-1.5 text-sm ${colors.time}`}>
                    <span>{popover.startTime}</span>
                    {popover.duration > 0 && (
                      <><span className="opacity-40">·</span><span>{popover.duration >= 60 ? `${popover.duration / 60}h` : `${popover.duration}m`}</span></>
                    )}
                  </div>
                )}

                {/* Location */}
                {popover.location && (
                  <p className="text-sm text-gray-500">{popover.location}</p>
                )}

                {/* Description */}
                {popover.description && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{popover.description}</p>
                )}

                {/* Travelers */}
                {popover.travelers && (
                  <p className="text-xs text-gray-400">{popover.travelers}</p>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ADD EVENT MODAL */}
      {addModal && (
        <AddEvent
          day={addModal.dayId}
          date={addModal.date}
          trip={tripId}
          members={members}
          initialStartTime={addModal.startTime}
          onClose={() => setAddModal(null)}
          onAdd={(event) => {
            handleEventAdded(event, addModal.dayId)
            setAddModal(null)
          }}
        />
      )}
    </>
  )
}
