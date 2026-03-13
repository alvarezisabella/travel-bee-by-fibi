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
    { id: "1", tripid: "1", dayid: "1", title: "Morning Event", description: "detail1.", status: "Confirmed", startTime: "09:00", duration: 30, location: "", travelers: "", type: "Activity", upvotes: 0, downvotes: 0 },
    { id: "2", tripid: "1", dayid: "1", title: "brunch", description: "detail2", status: "Pending", startTime: "11:00", duration: 60, location: "", travelers: "", type: "Food", upvotes: 0, downvotes: 0 },
    { id: "3", tripid: "1", dayid: "1", title: "shopping event", description: "", status: "Confirmed", startTime: "12:30", duration: 90, location: "", travelers: "", type: "Transit", upvotes: 0, downvotes: 0 },
    { id: "4", tripid: "1", dayid: "1", title: "afternoon event", description: "detail3", status: "Confirmed", startTime: "14:00", duration: 120, location: "", travelers: "", type: "Reservation", upvotes: 0, downvotes: 0 },
    { id: "5", tripid: "1", dayid: "1", title: "evening time", description: "", status: "Pending", startTime: "18:00", duration: 60, location: "", travelers: "", type: "Activity", upvotes: 0, downvotes: 0 },
  ]

const MOCK_DAYS:Day[] = [{id: "1", tripid: "1", events: SAMPLE_EVENTS}, {id: "2", tripid: "1", events:[]}]

export default function TripList({trip }: TripProps) {
        const [days, setDays] = useState<Day[]>(trip.days)
        const [showAdd, setShowAdd] = useState(false)
        const [dayid, setDayId] = useState<string>("")
        const [selectEvent, setEvent] = useState<Event | null>(null)
        const [open, setOpen] = useState(false)
    
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
    
        const handleDeleteEvent = (dayId: string, eventId: string) => {
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

        const handleAddDay = () => {
            setDays((prevDays) => [...prevDays, {id: (days.length + 1).toString(), tripid: trip.id, events: []}]);
        }

        const handleUpvote = (dayId: string, eventId: string) => {
            setDays(prev =>
                prev.map(day =>
                    day.id === dayId
                        ? {
                            ...day,
                            events: day.events.map(event => {
                                if (event.id !== eventId) return event

                                return {
                                    ...event,
                                    upvotes: event.upvotes + 1
                                }
                            })
                        }
                        : day
                )
            )
        }

        const handleDownvote = (dayId: string, eventId: string) => {
            setDays(prev =>
                prev.map(day =>
                    day.id === dayId
                        ? {
                            ...day,
                            events: day.events.map(event => {
                                if (event.id !== eventId) return event

                                return {
                                    ...event,
                                    downvotes: event.downvotes + 1
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
                <div className="w-full max-w-6xl mx-auto gap-2 ">
    
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
                        trip = {trip.id}
                        onClose={() => setShowAdd(false)}
                        onAdd={handleAddEvent}
                    />
                    )}
    
                    {selectEvent && (
                        <AddEvent
                            day = {selectEvent.dayid}
                            trip = {trip.id}
                            event = {selectEvent}
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