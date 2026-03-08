"use client"
import {useState, useCallback} from 'react'
import {Event} from "./event"
import {EventCard} from './event'
import AddEvent from './add_event'

interface Day{
    id: string
    events: Event[];
}
interface DayProps {
    day: Day;
    onAddEvent: (dayid : string) => void;
    onDeleteEvent: (dayid: string, eventid: string) => void;
}

const SAMPLE_EVENTS:Event[] = [
    { id: "1", dayid: "1", title: "Morning Event", description: "detail1.", startTime: "09:00", duration: 30, type: "outdoors" },
    { id: "2", dayid: "1", title: "brunch", description: "detail2", startTime: "11:00", duration: 60, type: "food" },
    { id: "3", dayid: "1", title: "shopping event", description: "", startTime: "12:30", duration: 90, type: "shopping" },
    { id: "4", dayid: "1", title: "afternoon event", description: "detail3", startTime: "14:00", duration: 120, type: "transportation" },
    { id: "5", dayid: "1", title: "evening time", description: "", startTime: "18:00", duration: 60, type: "cultural" },
  ]

const MOCK_DAYS:Day[] = [{id: "1", events: SAMPLE_EVENTS}]

export function DayCell({ day, onAddEvent, onDeleteEvent}: DayProps) {
    const [events, setEvents] = useState<Event[]>(day.events);
    const handleDelete = (id: string) => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
    };
    return(

        <div className="group border border-grey rounded-2xl p-6 mb-10 shadow-sm bg-white">
            <div className='mb-8'>
                <h1 className="text-[#1a1812] text-3xl">Day {day.id}</h1>
            </div>
                
            <div className='space-y-3'>
                {events.map((event) => (
                    <EventCard key={event.id} event={event} onDelete={() => onDeleteEvent(day.id, event.id)}/>
                ))}

                <button
                className="center opacity-0 group-hover:opacity-100 transition-opacity text-sm text-yellow-500"
                onClick={() => onAddEvent(day.id)}
                > Add event
            </button>
            </div>
        </div>
    )
}

export default function DayPreview() {
    const [days, setDays] = useState<Day[]>(MOCK_DAYS)
    const [showAdd, setShowAdd] = useState(false)
    const [dayid, setDayId] = useState<string>("")

    const initAddHandler = (dayid: string) => {
        setDayId(dayid)
        setShowAdd(true)
    }

    const handleAddEvent = useCallback((event: Omit<Event, "id">) => {
        const newEvent: Event = { ...event, id: crypto.randomUUID() };
        setDays(prev =>
            prev.map(day =>
                day.id === event.dayid
                    ? { ...day, events: [...day.events, newEvent] }
                    : day
            )
        );
    }, []);

    const handleDeleteEvent = (dayId: string, eventId: string) => {
        setDays(prev =>
            prev.map(day =>
                day.id === dayId
                    ? { ...day, events: day.events.filter(e => e.id !== eventId) }
                    : day
            )
        );
    };
    
    return(
        <div className="min-h-screen bg-[#f5f5f5] flex items-start justify-center pt-16 px-4">
            <div className="w-full max-w-sm">

                <div className="space-y-2.5">
                    {days.map((day) => (
                        <DayCell
                            key={day.id}
                            day={day}
                            onAddEvent={initAddHandler}
                            onDeleteEvent={handleDeleteEvent}
                        />
                    ))}
              </div>
              {showAdd && (
                <AddEvent
                    day = {dayid}
                    onClose={() => setShowAdd(false)}
                    onAdd={handleAddEvent}
                />
                )}
            </div>
        </div>

    );
}