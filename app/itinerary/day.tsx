"use client"
import {useState, useCallback} from 'react'
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import {Event} from "./types/types"
import {EventCard} from './components/event_card'
import EditEvent from './components/edit_event'
import { Traveler } from './types/types'
import { CalendarPlus } from "lucide-react"

// export interface Day{
//     id: string
//     itineraryid: string;
//     date?: string;
//     events: Event[];
// }
export const DAY_DROP_PREFIX = "day:"

export interface Day {
  id: string
  itineraryid: string;
  date?: string;
  events: Event[];
}
interface DayProps {
    day: Day;
    members: Traveler[]
    onAddEvent: (event: Event) => void;
    onEditEvent: (event: Event) => void;
    onDeleteEvent: (dayid: string, eventid: string, title: string) => void;
    onUpvote: (dayid: string, eventid: string) => void;
    onDownvote: (dayid: string, eventid: string) => void;
}

export function DayCell({ day, members, onAddEvent, onDeleteEvent, onEditEvent, onUpvote, onDownvote}: DayProps) {
    const [addEvent, setAdd] = useState(false)
    const { setNodeRef } = useDroppable({ id: `${DAY_DROP_PREFIX}${day.id}` })
    const seen = new Set<string>()
    const events = day.events.filter((e) => {
    if (seen.has(e.id)) {
      console.warn(`Duplicate event id "${e.id}" in day ${day.id} — dropping extra copy.`)
      return false
    }
    
    seen.add(e.id)
    return true
  })
  return (
    <div className="w-full group border-[0.2px] border-[#e6e6e6] rounded-2xl p-6 mb-10 shadow-lg bg-[#fff]">
      <div className='mb-8'>
        <h1 className="text-gray-800 text-3xl font-semibold mb-0.5">Day {day.id}</h1>
      </div>

      <div className='space-y-5'>
        <div ref={setNodeRef} className="min-h-[64px] space-y-5">
          <SortableContext
            items={events.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                members={members}
                onDelete={() => onDeleteEvent(day.id, event.id, event.title)}
                onSave={onEditEvent}
                onUpvote={() => onUpvote(day.id, event.id)}
                onDownvote={() => onDownvote(day.id, event.id)}
              />
            ))}
          </SortableContext>
          {addEvent && (
          <EditEvent
            day={day.id}
            date={day.date}
            trip={day.itineraryid}
            members={members}
            onClose={() => setAdd(false)}
            onSave={onAddEvent}
          />
        )}

        <div className='max-w-24 border border-[#e6e6e6] rounded-xl shadow-md
          group-hover:opacity-100 transition-opacity flex items-center justify-center font-semibold'>
          <button
            className="text-md text-yellow-500 py-1 cursor-pointer"
            onClick={() => setAdd(true)}
          >
            <CalendarPlus /> Add Event
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
