"use client"
import {useState, useCallback} from 'react'
import {Event} from "./event"
import {EventCard} from './components/event_card'
import AddEvent from './add_event'
import EditEvent from './components/edit_event'
import { Traveler } from './types/trips'

export interface Day{
    id: string
    itineraryid: string;
    date: string;
    events: Event[];
}
interface DayProps {
    day: Day;
    members: Traveler[]
    onAddEvent: (event: Event) => void;
    onEditEvent: (event: Event) => void;
    onDeleteEvent: (dayid: string, eventid: string) => void;
    onUpvote: (dayid: string, eventid: string) => void;
    onDownvote: (dayid: string, eventid: string) => void;
}

export function DayCell({ day, members, onAddEvent, onDeleteEvent, onEditEvent, onUpvote, onDownvote}: DayProps) {
    const [addEvent, setAdd] = useState(false)
    
    const handleAddEvent = (dayid:string) =>
    {
        setAdd(true)
    }
    return(

        <div className="group border border-[#c9c9c9] rounded-2xl p-6 mb-10 shadow-lg ">
            <div className='mb-8'>
                <h1 className="text-[#1a1812] text-3xl">Day {day.id}</h1>
            </div>
                
            <div className='space-y-5'>
                {day.events.map((event) => (
                    <EventCard key={event.id} event={event} members={members} onDelete={() => onDeleteEvent(day.id, event.id)} onSave={onEditEvent} onUpvote={() => onUpvote(day.id, event.id)} onDownvote={() => onDownvote(day.id, event.id)}/>
                ))}

                {addEvent && (
                    <EditEvent day={day.id} date={day.date} trip={day.itineraryid} members={members} onClose={() => setAdd(false)} onSave={onAddEvent}/>
                )}

                <div className='max-w-24 border border-[#c9c9c9] rounded-2xl shadow-md 
                opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                    <button
                    className="text-md text-yellow-500 py-1"
                    onClick={() => setAdd(true)}
                    > Add Event
                    </button>
                 </div>
            </div>
        </div>
    )
}

