"use client"
import {useState, useCallback} from 'react'
import {Event} from "./../event"
import {EventCard} from './../event'
import AddEvent from './../add_event'
import {Day, DayCell} from './../day'
import AddDayButton from './AddDay'
import { Trip } from './../types/trips'
import { Plus } from "lucide-react"

interface TripProps {
    trip: Trip;
}

const SAMPLE_EVENTS:Event[] = [
    { id: "1", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "Morning Event", description: "detail1.", status: "Confirmed", startTime: "09:00", duration: 30, location: "", travelers: "", type: "Activity", upvotes: 0, downvotes: 0 },
    { id: "2", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "brunch", description: "detail2", status: "Pending", startTime: "11:00", duration: 60, location: "", travelers: "", type: "Food", upvotes: 0, downvotes: 0 },
    { id: "3", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "shopping event", description: "", status: "Confirmed", startTime: "12:30", duration: 90, location: "", travelers: "", type: "Transit", upvotes: 0, downvotes: 0 },
    { id: "4", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "afternoon event", description: "detail3", status: "Confirmed", startTime: "14:00", duration: 120, location: "", travelers: "", type: "Reservation", upvotes: 0, downvotes: 0 },
    { id: "5", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", dayid: "1", title: "evening time", description: "", status: "Pending", startTime: "18:00", duration: 60, location: "", travelers: "", type: "Activity", upvotes: 0, downvotes: 0 },
  ]

const MOCK_DAYS:Day[] = [{id: "1", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", events: SAMPLE_EVENTS}, {id: "2", itineraryid: "165f0341-9cab-456f-97f8-c727b09fa36b", events:[]}]

export default function TripList({trip }: TripProps) {
        const [days, setDays] = useState<Day[]>(trip.days)
        const [showAdd, setShowAdd] = useState(false)
        const [dayid, setDayId] = useState<string>("")
        const [dayDate, setDayDate] = useState<string>("")
        const [selectEvent, setEvent] = useState<Event | null>(null)
        const [open, setOpen] = useState(false)
    
        const initAddHandler = (dayid: string, date: string) => {
            setDayId(dayid)
            setDayDate(date)
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
    
        const handleOpenEvent = (event: Event) => {
            setEvent(event)
        }

        // When adding a day, calculates the next date based on the trip's start date and the number of existing days. 
        // If the new date exceeds the itinerary's end date, updates the itinerary's end date accordingly.
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
                // Toggle off: delete existing upvote
                const res = await fetch('/api/auth/eventVote', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: event.voteId }),
                })
                if (!res.ok) { console.error('Failed to remove upvote'); return }
            } else {
                // Delete existing downvote first if switching
                if (event.hasDownvoted) {
                    const res = await fetch('/api/auth/eventVote', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: event.voteId }),
                    })
                    if (!res.ok) { console.error('Failed to remove downvote'); return }
                }
                // Post new upvote
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
                // Toggle off: delete existing downvote
                const res = await fetch('/api/auth/eventVote', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: event.voteId }),
                })
                if (!res.ok) { console.error('Failed to remove downvote'); return }
            } else {
                // Delete existing upvote first if switching
                if (event.hasUpvoted) {
                    const res = await fetch('/api/auth/eventVote', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: event.voteId }),
                    })
                    if (!res.ok) { console.error('Failed to remove upvote'); return }
                }
                // Post new downvote
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
        
        return(

            
            // Display of Days
            <div className="pt-16 px-4">
                <div className="w-full max-w-5xl mx-auto ">
    
                    <div className="space-y-2.5">
                        {days.map((day) => (
                            <DayCell
                                key={day.id}
                                day={day}
                                onAddEvent={initAddHandler}
                                onDeleteEvent={handleDeleteEvent}
                                onOpenEvent={handleOpenEvent}
                                onUpvote={handleUpvote}
                                onDownvote={handleDownvote}
                            />
                        ))}
                  </div>
                  {showAdd && (
                    <AddEvent
                        day = {dayid}
                        date = {dayDate}
                        trip = {trip.id}
                        members = {trip.travelers}
                        onClose={() => setShowAdd(false)}
                        onAdd={handleAddEvent}
                    />
                    )}
    
                    {selectEvent && (
                        <AddEvent
                            day = {selectEvent.dayid}
                            trip = {trip.id}
                            event = {selectEvent}
                            members = {trip.travelers}
                            onClose={() => setEvent(null)}
                            onAdd={handleEdit}
                        />
                    )}
                    <div className="mt-6">

                {/* Add Day Button */}
                <button
                  onClick={handleAddDay}
                  className="
                     w-full max-w-6xl mx-auto
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