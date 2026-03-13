"use client"
import {useState, useCallback} from 'react'
import {Event} from "./event"
import {EventCard} from './event'
import AddEvent from './add_event'

export interface Day{
    id: string
    tripid: string;
    events: Event[];
}
interface DayProps {
    day: Day;
    onAddEvent: (dayid : string) => void;
    onDeleteEvent: (dayid: string, eventid: string) => void;
    onOpenEvent: (event: Event) => void
}

const SAMPLE_EVENTS:Event[] = [
    { id: "1", tripid: "1", dayid: "1", title: "Morning Event", description: "detail1.", status: "Confirmed", startTime: "09:00", duration: 30, location: "", travelers: "", type: "Activity" },
    { id: "2", tripid: "1", dayid: "1", title: "brunch", description: "detail2", status: "Pending", startTime: "11:00", duration: 60, location: "", travelers: "", type: "Food" },
    { id: "3", tripid: "1", dayid: "1", title: "shopping event", description: "", status: "Confirmed", startTime: "12:30", duration: 90, location: "", travelers: "", type: "Transit" },
    { id: "4", tripid: "1", dayid: "1", title: "afternoon event", description: "detail3", status: "Confirmed", startTime: "14:00", duration: 120, location: "", travelers: "", type: "Reservation" },
    { id: "5", tripid: "1", dayid: "1", title: "evening time", description: "", status: "Pending", startTime: "18:00", duration: 60, location: "", travelers: "", type: "Activity" },
  ]

const MOCK_DAYS:Day[] = [{id: "1", tripid: "1", events: SAMPLE_EVENTS}, {id: "2", tripid: "1", events:[]}]

export function DayCell({ day, onAddEvent, onDeleteEvent, onOpenEvent}: DayProps) {
    return(

        <div className="max-w-3xl group border border-[#c9c9c9] rounded-2xl p-6 mb-10 shadow-lg ">
            <div className='mb-8'>
                <h1 className="text-[#1a1812] text-3xl">Day {day.id}</h1>
            </div>
                
            <div className='space-y-5'>
                {day.events.map((event) => (
                    <EventCard key={event.id} event={event} onDelete={() => onDeleteEvent(day.id, event.id)} onOpen={() => onOpenEvent(event)}/>
                ))}

                <div className='max-w-24 border border-[#c9c9c9] rounded-2xl shadow-md 
                opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                    <button
                    className="text-md text-yellow-500 py-1"
                    onClick={() => onAddEvent(day.id)}
                    > Add Event
                    </button>
                 </div>
            </div>
        </div>
    )
}

export default function DayPreview() {
    const [days, setDays] = useState<Day[]>(MOCK_DAYS)
    const [showAdd, setShowAdd] = useState(false)
    const [dayid, setDayId] = useState<string>("")
    const [selectEvent, setEvent] = useState<Event | null>(null)
    const tripid = days[0].tripid

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
    
    return(
        <div className="min-h-screen bg-[#f5f5f5] flex justify-center pt-16 px-4">
            <div className="w-full max-w-lg">

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
                    trip = {tripid}
                    onClose={() => setShowAdd(false)}
                    onAdd={handleAddEvent}
                />
                )}

                {selectEvent && (
                    <AddEvent
                        day = {selectEvent.dayid}
                        trip = {tripid}
                        event = {selectEvent}
                        onClose={() => setEvent(null)}
                        onAdd={handleEdit}
                    />
                )}
            </div>
        </div>

    );
}