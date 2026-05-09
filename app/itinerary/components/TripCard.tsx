"use client"
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useItineraryRealtime } from '@/lib/hooks/useItineraryRealtime'
import { Day, DayCell } from './../day'
import { Trip, Event } from '../types/types'
import { CirclePlus, X } from "lucide-react"
import { ChatSidebar } from './sidebar'
import EditEvent from "./edit_event"

interface TripProps {
  trip: Trip
}

export default function TripList({ trip }: TripProps) {
  const router = useRouter()
  const [days, setDays] = useState<Day[]>(trip.days)
  const [showAdd, setShowAdd] = useState(false)
  const [dayid, setDayId] = useState<string>("")
  const [dayDate, setDayDate] = useState<string>("")
  const [hovered, setHovered] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [footerHeight, setFooterHeight] = useState(0)

  useEffect(() => {
    const measure = () => {
        const footer = document.querySelector("footer")
        if (footer) setFooterHeight(footer.getBoundingClientRect().height)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  useEffect(() => { setDays(trip.days) }, [trip])
  useItineraryRealtime(trip.id, () => router.refresh())

  const handleAddEvent = useCallback((newEvent: Event) => {
    setDays(prev =>
      prev.map(day =>
        day.id === newEvent.dayid
          ? { ...day, events: [...day.events, newEvent] }
          : day
      )
    )
  }, [])

  useEffect(() => {
    function onBookmarkAdded(e: CustomEvent) { handleAddEvent(e.detail) }
    window.addEventListener('bookmark-added', onBookmarkAdded as EventListener)
    return () => window.removeEventListener('bookmark-added', onBookmarkAdded as EventListener)
  }, [handleAddEvent])

  const handleEdit = (alteredEvent: Event) => {
    setDays(prev =>
      prev.map(day =>
        day.id === alteredEvent.dayid
          ? { ...day, events: day.events.map(e => e.id === alteredEvent.id ? alteredEvent : e) }
          : day
      )
    )
    router.refresh()
  }

  const handleDeleteEvent = async (dayId: string, eventId: string, title: string) => {
    const res = await fetch('/api/auth/event', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itineraryid: trip.id, id: eventId, title })
    })
    if (!res.ok) { console.error('Failed to delete event'); return }
    setDays(prev =>
      prev.map(day =>
        day.id === dayId
          ? { ...day, events: day.events.filter(e => e.id !== eventId) }
          : day
      )
    )
  }

  const handleAddDay = async () => {
    const startDate = trip.startDate ? new Date(trip.startDate) : null
    const nextDate = startDate
      ? new Date(startDate.getTime() + days.length * 86400000).toISOString().split('T')[0]
      : undefined
    if (nextDate && (!trip.endDate || nextDate > trip.endDate)) {
      await fetch('/api/auth/itinerary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trip.id, end_date: nextDate })
      })
    }
    setDays(prev => [...prev, { id: String(prev.length + 1), itineraryid: trip.id, date: nextDate, events: [] }])
  }

  const handleUpvote = async (dayId: string, eventId: string) => {
    const day = days.find(d => d.id === dayId)
    const event = day?.events.find(e => e.id === eventId)
    if (!event) return
    let newVoteId: string | undefined = undefined
    if (event.hasUpvoted) {
      const res = await fetch('/api/auth/eventVote', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: event.voteId }) })
      if (!res.ok) return
    } else {
      if (event.hasDownvoted) {
        await fetch('/api/auth/eventVote', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: event.voteId }) })
      }
      const res = await fetch('/api/auth/eventVote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: eventId, vote_type: 'upvote' }) })
      if (!res.ok) return
      const data = await res.json()
      newVoteId = data.vote?.id
    }
    setDays(prev => prev.map(day => day.id === dayId ? {
      ...day, events: day.events.map(ev => {
        if (ev.id !== eventId) return ev
        if (ev.hasUpvoted) return { ...ev, upvotes: ev.upvotes - 1, hasUpvoted: false, voteId: undefined }
        return { ...ev, upvotes: ev.upvotes + 1, hasUpvoted: true, downvotes: ev.hasDownvoted ? ev.downvotes - 1 : ev.downvotes, hasDownvoted: false, voteId: newVoteId }
      })
    } : day))
  }

  const handleDownvote = async (dayId: string, eventId: string) => {
    const day = days.find(d => d.id === dayId)
    const event = day?.events.find(e => e.id === eventId)
    if (!event) return
    let newVoteId: string | undefined = undefined
    if (event.hasDownvoted) {
      const res = await fetch('/api/auth/eventVote', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: event.voteId }) })
      if (!res.ok) return
    } else {
      if (event.hasUpvoted) {
        await fetch('/api/auth/eventVote', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: event.voteId }) })
      }
      const res = await fetch('/api/auth/eventVote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: eventId, vote_type: 'downvote' }) })
      if (!res.ok) return
      const data = await res.json()
      newVoteId = data.vote?.id
    }
    setDays(prev => prev.map(day => day.id === dayId ? {
      ...day, events: day.events.map(ev => {
        if (ev.id !== eventId) return ev
        if (ev.hasDownvoted) return { ...ev, downvotes: ev.downvotes - 1, hasDownvoted: false, voteId: undefined }
        return { ...ev, downvotes: ev.downvotes + 1, hasDownvoted: true, upvotes: ev.hasUpvoted ? ev.upvotes - 1 : ev.upvotes, hasUpvoted: false, voteId: newVoteId }
      })
    } : day))
  }

  const anyFormOpen = showAdd

  return (
    <div className="pt-6 pb-4 text-gray-800">
      <div className="flex flex-col gap-4 w-full">
        {days.map(day => (
          <DayCell
            key={day.id}
            day={day}
            members={trip.travelers}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEdit}
            onDeleteEvent={handleDeleteEvent}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
          />
        ))}

        {showAdd && (
          <EditEvent
            day={dayid}
            date={dayDate}
            trip={trip.id}
            members={trip.travelers}
            onClose={() => setShowAdd(false)}
            onSave={handleAddEvent}
          />
        )}

        <button
          onClick={handleAddDay}
          className="w-full bg-[#fafafa] cursor-pointer flex items-center justify-center gap-2 py-4 shadow-sm text-xl font-semibold transition rounded-xl"
          style={{
            borderWidth: "0.5px",
            borderColor: hovered ? "rgba(250, 197, 37, 0.5)" : "#fff",
            boxShadow: hovered ? "0 2px 10px rgba(250, 197, 37, 0.7)" : "0 2px 16px rgba(0,0,0,0.07)",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <CirclePlus size={24} strokeWidth={3} className="text-yellow-400" />
          <span className="px-2 pt-1">Add Day</span>
        </button>
      </div>

      {/* Floating bee — hidden when any form is open */}
      {!anyFormOpen && (
        <button
            onClick={() => setChatOpen(o => !o)}
            className="fixed z-50 w-16 h-16 bg-yellow-400 hover:bg-yellow-500 active:scale-95 rounded-full shadow-xl flex items-center justify-center text-3xl transition-all hover:shadow-2xl"
            style={{ bottom: "24px", right: "24px" }}
            aria-label="Open Agent Atlas"
        >
            🐝
        </button>
      )}

      {/* Chat drawer */}
      {chatOpen && !anyFormOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden bg-black/20"
            onClick={() => setChatOpen(false)}
          />
          <div
            className="fixed z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            style={{
                bottom: "24px", right: "24px",
            //   bottom: `calc(${footerHeight}px + 100px)`,
            //   right: "24px",
              width: "min(420px, calc(100vw - 48px))",
              height: "min(500px, calc(100vh - 160px))",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐝</span>
                <span className="font-semibold text-gray-900 text-sm">Agent Atlas</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatSidebar trip={trip} days={days} mobileMode />
            </div>
          </div>
        </>
      )}
    </div>
  )
}