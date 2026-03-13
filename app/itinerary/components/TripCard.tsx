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