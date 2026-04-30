// app/demo/[id]/DemoAccordion.tsx
"use client"

import { useState } from 'react'
import { ChevronDown, Clock, Bookmark, Check } from 'lucide-react'
import { DemoDay, DemoEvent } from '../demoData'

const TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  Activity:    { bg: "bg-[#fff3cd]", text: "text-[#7d5a00]" },
  Transit:     { bg: "bg-[#dce8f5]", text: "text-[#1e4a72]" },
  Reservation: { bg: "bg-[#fde8c8]", text: "text-[#7a3e00]" },
  Food:        { bg: "bg-[#fce4ec]", text: "text-[#7b1a35]" },
}

const TYPE_THUMB: Record<string, string> = {
  Activity:    "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=200&q=80",
  Transit:     "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&q=80",
  Reservation: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80",
  Food:        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80",
}

interface Trip {
  id: string
  title: string
}

function formatTime(time: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatDuration(mins: number) {
  if (!mins) return ''
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}.${Math.round((m / 60) * 10)} hours` : `${h} hour${h !== 1 ? 's' : ''}`
}

export default function DemoAccordion({ days, trips, user }: { days: DemoDay[], trips: Trip[], user:string|undefined }) {
  const [pickTripID, setPickTripID] = useState<string | null>(null)
  const [toast, setToast] = useState<string|null>(null)
  const [openDays, setOpenDays] = useState<Set<string>>(
    new Set(days.map(d => d.id))
  )

  function toggleDay(id: string) {
    setOpenDays(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500) // disappears after 2.5s
}

  const addToTrip = async (trip:Trip, event:DemoEvent) => {
    const res = await fetch("/api/auth/widgets", {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({title: event.title, description: event.description, location: event.location, type: event.type, itinerary_id: trip.id})})

      const data = await res.json()
      if(!res.ok) {console.error(data.error); return;}
      showToast(`Saved to ${trip.title} Bookmarks!`)
  }

  return (
    <>
      {days.map((day, idx) => {
        const isOpen = openDays.has(day.id)
        const dateLabel = new Date(day.date).toLocaleDateString('en-US', {
          weekday: 'long', month: 'short', day: 'numeric',
        })

        return (
          <div key={day.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <button
              onClick={() => toggleDay(day.id)}
              className="w-full flex items-center gap-4 px-6 py-5 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-[16px] transition-colors duration-200 ${
                isOpen ? 'bg-[#F5C300] text-[#3d3000]' : 'bg-gray-100 text-gray-500'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[16px] text-gray-900">Day {day.id}</p>
                <p className="text-[13px] text-gray-400">{dateLabel}</p>
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {day.events.map((event) => {
                  const badge = TYPE_BADGE[event.type] ?? TYPE_BADGE['Activity']
                  const thumb = TYPE_THUMB[event.type] ?? TYPE_THUMB['Activity']
                  const isOpen = Object.is(pickTripID, event.id)              

                  return (
                    <div key={event.id} className="flex items-stretch px-6 py-5 gap-5">
                      <div className="w-[110px] h-[110px] rounded-2xl overflow-hidden shrink-0">
                        <img src={thumb} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[12px] font-medium text-gray-500 flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {formatTime(event.startTime)}
                          </span>
                          {event.duration > 0 && (
                            <span className="text-[12px] text-gray-400">· {formatDuration(event.duration)}</span>
                          )}
                        </div>
                        <p className="text-[16px] font-semibold text-gray-900 leading-snug mb-2">{event.title}</p>
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2 ${badge.bg} ${badge.text}`}>
                          {event.type}
                        </span>
                        <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2">{event.description}</p>
                      </div>
                      {!isOpen && (
                        <button onClick={() => setPickTripID(Object.is(pickTripID, event.id) ? null : event.id)}>
                          <Bookmark strokeWidth={1} className='text-gray-400 hover:text-gray-800'/>
                        </button>
                      )}
                      {isOpen && (
                        <div className="z-10 bg-white rounded-xl border border-gray-200 shadow-lg w-md p-3 flex flex-col gap-2 transition">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                            Add to trip
                          </p>
                          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                            {trips.map((trip) => (
                              <button
                                key={trip.id}
                                className="text-left text-[13px] font-semibold text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                                onClick={() => {
                                  // handle adding event to trip here
                                  addToTrip(trip, event)
                                  setPickTripID(null)
                                }}
                              >
                                {trip.title}
                              </button>
                            ))}
                          </div>
                          <button
                            className="text-[12px] text-gray-400 hover:text-gray-600 mt-1 text-center"
                            onClick={() => setPickTripID(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}                       
                    </div>
                  )
                })}            
              </div>
            </div>
            {toast && (
              <div className="flex items-center fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-[13px] font-medium px-4 py-2.5 rounded-full shadow-lg animate-fade-in">
                 <Check className="mr-1" size={20}/>{toast}
              </div>
            )}            
          </div>
        )
      })}
    </>
  )
}