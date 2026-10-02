"use client"
import { useEffect, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Event, LABEL_MAP } from "./types/types"
import { Day, DAY_DROP_PREFIX } from "./day"

export interface EventMove {
  eventId: string
  fromDayId: string
  toDayId: string
}

interface DayBoardProps {
  days: Day[]
  /**
   * Called once, when a drag finishes and something actually changed.
   * Return (or await) a promise — DayBoard waits for it before allowing
   * another drag to commit, so rapid consecutive drags can't race each
   * other or a realtime refresh landing mid-drag.
   */
  onChange: (next: Day[], move: EventMove) => void | Promise<void>
  /** Render one day. Remember to put key={day.id} on what you return. */
  renderDay: (day: Day) => React.ReactNode
}

const isDayDrop = (id: string | number) => String(id).startsWith(DAY_DROP_PREFIX)
const dayIdFromDrop = (id: string | number) => String(id).slice(DAY_DROP_PREFIX.length)

function findDayByEvent(days: Day[], eventId: string | number) {
  return days.find((d) => d.events.some((e) => e.id === eventId))
}

// "over" can be either another event card or an (empty) day container
function resolveTargetDay(days: Day[], overId: string | number) {
  return isDayDrop(overId)
    ? days.find((d) => d.id === dayIdFromDrop(overId))
    : findDayByEvent(days, overId)
}

export function DayBoard({ days, onChange, renderDay }: DayBoardProps) {
  // While dragging we render a local copy so the card visibly hops between days.
  // Nothing is committed to the parent until the drop.
  const [draft, setDraft] = useState<Day[] | null>(null)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const originDayId = useRef<string | null>(null)
  const isDragging = useRef(false)
  const isSaving = useRef(false)

  const shown = draft ?? days

  // If fresh `days` arrive from the server (e.g. a realtime refresh from our
  // own last write) while nothing is actively being dragged, drop any leftover
  // draft rather than let a later drag build on top of now-stale local state.
  // This is what prevented the same event id ending up in two days at once
  // after several rapid drags.
  useEffect(() => {
    if (!isDragging.current) setDraft(null)
  }, [days])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const reset = () => {
    setDraft(null)
    setActiveEvent(null)
    originDayId.current = null
    isDragging.current = false
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    // A previous drag's save hasn't resolved yet — ignore this one rather
    // than let two writes (and the refreshes they trigger) overlap.
    if (isSaving.current) return

    isDragging.current = true
    const day = findDayByEvent(days, active.id)
    originDayId.current = day?.id ?? null
    setActiveEvent(day?.events.find((e) => e.id === active.id) ?? null)
  }

  // Fires as the card crosses into another day: move it in the draft.
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return

    setDraft((prev) => {
      const cur = prev ?? days
      const from = findDayByEvent(cur, active.id)
      const to = resolveTargetDay(cur, over.id)
      if (!from || !to || from.id === to.id) return prev

      const moving = from.events.find((e) => e.id === active.id)
      if (!moving) return prev

      let index: number
      if (isDayDrop(over.id)) {
        index = to.events.length // dropped on the day itself (e.g. an empty day): append
      } else {
        const overIndex = to.events.findIndex((e) => e.id === over.id)
        const translated = active.rect.current.translated
        const isBelow = !!translated && translated.top > over.rect.top + over.rect.height / 2
        index = overIndex + (isBelow ? 1 : 0)
      }

      return cur.map((d) => {
        if (d.id === from.id) {
          return { ...d, events: d.events.filter((e) => e.id !== active.id) }
        }
        if (d.id === to.id) {
          const events = [...d.events]
          events.splice(index, 0, { ...moving, dayid: to.id })
          return { ...d, events }
        }
        return d
      })
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const fromDayId = originDayId.current
    if (!over || !fromDayId) return reset() // dropped outside: discard the draft

    let next = draft ?? days
    const current = findDayByEvent(next, active.id)
    if (!current) return reset()

    // Reorder within the day the card ended up in
    if (!isDayDrop(over.id)) {
      const overDay = findDayByEvent(next, over.id)
      if (overDay && overDay.id === current.id) {
        const oldIndex = current.events.findIndex((e) => e.id === active.id)
        const newIndex = current.events.findIndex((e) => e.id === over.id)
        if (oldIndex !== newIndex) {
          next = next.map((d) =>
            d.id === current.id ? { ...d, events: arrayMove(d.events, oldIndex, newIndex) } : d
          )
        }
      }
    }

    const beforeDay = findDayByEvent(days, active.id)
    const afterDay = findDayByEvent(next, active.id)
    const beforeIndex = beforeDay?.events.findIndex((e) => e.id === active.id) ?? -1
    const afterIndex = afterDay?.events.findIndex((e) => e.id === active.id) ?? -1
    const changed = fromDayId !== afterDay?.id || beforeIndex !== afterIndex

    if (changed && afterDay) {
      isSaving.current = true
      Promise.resolve(onChange(next, { eventId: String(active.id), fromDayId, toDayId: afterDay.id }))
        .finally(() => { isSaving.current = false })
    }
    reset()
  }

  return (
    <DndContext
      id="itinerary-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
    >
      {shown.map((day) => renderDay(day))}

      {/* The overlay is what follows the cursor; the original card stays put as a faded placeholder. */}
      <DragOverlay>{activeEvent ? <EventDragPreview event={activeEvent} /> : null}</DragOverlay>
    </DndContext>
  )
}

function EventDragPreview({ event }: { event: Event }) {
  const colors = LABEL_MAP[event.type]
  return (
    <div className="max-w-7xl rounded-xl border border-[#e6e6e6] bg-white p-4 shadow-xl cursor-grabbing">
      <h4 className="font-medium text-[20px] text-primary tracking-tight truncate">{event.title}</h4>
      <span
        className={`mt-2 inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md tracking-wide ${colors.bg} ${colors.text}`}
      >
        {event.type}
      </span>
    </div>
  )
}
