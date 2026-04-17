"use client"
import {useState, useCallback, useEffect} from 'react'
import { useRouter } from 'next/navigation'
import { useItineraryRealtime } from '@/lib/hooks/useItineraryRealtime'
import {EventCard} from './event_card'
import {Day, DayCell} from './../day'
import { Trip, Event, Widget } from '../types/types'
import { Plus } from "lucide-react"
import { ChatSidebar } from './sidebar'
import EditEvent from "./edit_event"
import { it } from 'node:test'

interface TripProps {
    trip: Trip;
}

export default function TripList({ trip }: TripProps) {
    const router = useRouter()
    const [days, setDays] = useState<Day[]>(trip.days)
    const [showAdd, setShowAdd] = useState(false)
    const [dayid, setDayId] = useState<string>("")
    const [dayDate, setDayDate] = useState<string>("")
    const [selectEvent, setEvent] = useState<Event | null>(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        setDays(trip.days)
    }, [trip])

    useItineraryRealtime(trip.id, () => router.refresh())

    const initAddHandler = (dayid: string) => {
        setDayId(dayid)
        setShowAdd(true)
    }

    const handleAddEvent = useCallback((newEvent: Event) => {
        setDays(prev =>
            prev.map(day =>
                day.id === newEvent.dayid
                    ? { ...day, events: [...day.events, newEvent] }
                    : day
            )
        );
    }, []);

    useEffect(() => {
        function onBookmarkAdded(e: CustomEvent) {
            handleAddEvent(e.detail)
        }
        window.addEventListener('bookmark-added', onBookmarkAdded as EventListener)
        return () => window.removeEventListener('bookmark-added', onBookmarkAdded as EventListener)
    }, [handleAddEvent])

    const handleEdit = (alteredEvent: Event) => {
        setDays(prev =>
            prev.map(day =>
                day.id === alteredEvent.dayid
                    ? { ...day,
                        events: day.events.map(event =>
                            event.id === alteredEvent.id ? alteredEvent : event
                        )
                    }
                    : day
            )
        )
        router.refresh()
    }

    const handleDeleteEvent = async (dayId: string, eventId: string) => {
        const res = await fetch('/api/auth/event', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: eventId })
        })
        if (!res.ok) { console.error('Failed to delete event'); return }
        setDays(prev =>
            prev.map(day =>
                day.id === dayId
                    ? { ...day, events: day.events.filter(e => e.id !== eventId) }
                    : day
            )
        );
    };

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
            const res = await fetch('/api/auth/eventVote', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: event.voteId }),
            })
            if (!res.ok) { console.error('Failed to remove upvote'); return }
        } else {
            if (event.hasDownvoted) {
                const res = await fetch('/api/auth/eventVote', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: event.voteId }),
                })
                if (!res.ok) { console.error('Failed to remove downvote'); return }
            }
            const res = await fetch('/api/auth/eventVote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id: eventId, vote_type: 'upvote' }),
            })
            if (!res.ok) { console.error('Failed to save upvote'); return }
            const data = await res.json()
            newVoteId = data.vote?.id
        }

        setDays(prev =>
            prev.map(day =>
                day.id === dayId
                    ? {
                        ...day,
                        events: day.events.map(ev => {
                            if (ev.id !== eventId) return ev
                            if (ev.hasUpvoted) {
                                return { ...ev, upvotes: ev.upvotes - 1, hasUpvoted: false, voteId: undefined }
                            }
                            return {
                                ...ev,
                                upvotes: ev.upvotes + 1,
                                hasUpvoted: true,
                                downvotes: ev.hasDownvoted ? ev.downvotes - 1 : ev.downvotes,
                                hasDownvoted: false,
                                voteId: newVoteId,
                            }
                        })
                    }
                    : day
            )
        )
    }

    const handleDownvote = async (dayId: string, eventId: string) => {
        const day = days.find(d => d.id === dayId)
        const event = day?.events.find(e => e.id === eventId)
        if (!event) return

        let newVoteId: string | undefined = undefined

        if (event.hasDownvoted) {
            const res = await fetch('/api/auth/eventVote', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: event.voteId }),
            })
            if (!res.ok) { console.error('Failed to remove downvote'); return }
        } else {
            if (event.hasUpvoted) {
                const res = await fetch('/api/auth/eventVote', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: event.voteId }),
                })
                if (!res.ok) { console.error('Failed to remove upvote'); return }
            }
            const res = await fetch('/api/auth/eventVote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id: eventId, vote_type: 'downvote' }),
            })
            if (!res.ok) { console.error('Failed to save downvote'); return }
            const data = await res.json()
            newVoteId = data.vote?.id
        }

        setDays(prev =>
            prev.map(day =>
                day.id === dayId
                    ? {
                        ...day,
                        events: day.events.map(ev => {
                            if (ev.id !== eventId) return ev
                            if (ev.hasDownvoted) {
                                return { ...ev, downvotes: ev.downvotes - 1, hasDownvoted: false, voteId: undefined }
                            }
                            return {
                                ...ev,
                                downvotes: ev.downvotes + 1,
                                hasDownvoted: true,
                                upvotes: ev.hasUpvoted ? ev.upvotes - 1 : ev.upvotes,
                                hasUpvoted: false,
                                voteId: newVoteId,
                            }
                        })
                    }
                    : day
            )
        )
    }

    return (
        <div className="pt-16 px-4">
            <div className="w-full max-w-6xl mx-auto">

                {/* Sidebar */}
                <div className="hidden md:block shrink-0">
                    <ChatSidebar
                        trip={trip}
                        days={days}
                    />
                </div>

                <div className="space-y-2.5 col-span-3">
                    {days.map((day) => (
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
                </div>

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

                <div className="col-span-3 col-start-2 relative center">
                    <button
                        onClick={handleAddDay}
                        className="
                            w-full
                            flex items-center justify-center gap-2
                            bg-gray-100
                            border border-orange-400
                            rounded-xl
                            py-4
                            text-lg font-medium
                            hover:bg-yellow-400
                            transition
                        "
                    >
                        <Plus size={20} className="text-orange-500" />
                        Add Day
                    </button>
                </div>

            </div>
        </div>
    );
}