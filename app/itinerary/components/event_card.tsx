"use client"
import {useState} from "react";
import { ThumbsUp, ThumbsDown, Trash2 } from "lucide-react"
import EditEvent from "./edit_event"
import { Event, EventLabel, EventStatus, cardColor, STATUS_MAP, LABEL_MAP} from "../types/types";
import { Traveler } from "../types/types";
import { useEventLock } from "@/lib/hooks/event_lock";


interface EventCardProp {
    event: Event;
    members: Traveler[]
    onDelete: (eventid: string) => void
    onSave: (editedEvent: Event) => void
    onUpvote: (eventid: string) => void
    onDownvote: (eventid: string) => void
}


export function EventCard({event, members, onDelete, onSave, onUpvote, onDownvote }: EventCardProp) {
  const [hovered, setHovered] = useState(false)
  const [isEditing, setEditing] = useState(false)
  const { lock, acquireLock, releaseLock } = useEventLock(event.id);
  const colors = LABEL_MAP[event.type];
  const status_bg = STATUS_MAP[event.status]

  // only allow one user to edit event at a time
  const handleEdit = async () => {
    const acquired = await acquireLock()
    if(acquired) setEditing(true)
  }
  const handleClose = async () => {
    await releaseLock()
    setEditing(false)
  }
  const isLockedByOther = lock.lockedBy && !lock.isLockedByMe;

  return(
    <div className="event-card">
    
    {/* indicate that another user is editing*/}
    {isLockedByOther && (
        <div className="mb-2 flex items-center gap-2 text-sm text-amber-600">
            <span>This is being edited</span>
        </div>
    )}
    {lock.isLockedByMe && isEditing && (
        <div className="mb-2 text-sm text-green-600"> You are editing</div>
    )}    
    {isEditing ? (
        <EditEvent key={event.id} day={event.dayid} trip={event.itineraryid} event={event} members={members} onClose={handleClose} onSave={onSave}></EditEvent>

    ) : (
    <div // EVENT CARD:
        className={`max-w-5xl relative flex gap-3 ${cardColor.bg} rounded-xl p-3.5 border border-[#c9c9c9] transition-shadow cursor-pointer`}
        style={{ boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.08)" : "none", pointerEvents:isLockedByOther? "none" : "all"}}
        onClick={handleEdit}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
    >
        {/* left side bar*/}
        <div className={`w-1 rounded-full ${status_bg} flex-shrink-0`} />

        {/* event status: confirmed, pending, idea */}
        <div 
        style={{fontFamily:"Helvetica"}}
        className={`absolute top-2 right-8 max-w-24 rounded-xl ${status_bg} shadow-sm items-center justify-center`}>
        <h4 className="px-2 py-1 text-white text-xs">{event.status}</h4>
        </div>


        {/*Event Title*/}
        <div className="flex-1 min-w-0 space-y-1.5 ">
        <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium text-lg ${cardColor.text} truncate`} style={{ fontFamily: "Helvetica, serif" }}>
            {event.title}
            </h4>

            {/*delete button*/}
            <button
            onClick={(e) => {
                e.stopPropagation()
                onDelete(event.id)
            }}
            style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}
            className="leading-none flex-shrink-0 -mt-0.5"
            >
            <Trash2 size={16} />
            </button>
        </div>

        <div className={`max-w-24 rounded-sm py-1 ${colors.bg} flex items-center justify-center`}>
            <h4 className={`text-xs ${colors.text} opacity-100`}>{event.type}</h4>
        </div>
        {event.description && (
            <p className={`text-xs mt-1 ${cardColor.time} opacity-80 whitespace-pre-wrap`} style={{ fontFamily: "Georgia, serif" }}>
            {event.description}
            </p>
        )}

        <div className={`flex items-center gap-1.5 mt-2 text-xs ${cardColor.time}`}>
            <span>{event.startTime}</span>
            <span className="opacity-40">·</span>
            <span>{event.duration}</span>
        </div>

        <div className="absolute top-2 right-30 flex items-center gap-4 mt-2">
            <button
            className={`flex items-center gap-1 text-xs transition
            ${event.hasUpvoted ? "text-green-600" : "hover:text-green-600"}
            `}
            onClick={(e) => {
                e.stopPropagation()
                onUpvote(event.id)
            }}
            >
            <ThumbsUp size={14} fill={event.hasUpvoted ? "currentColor" : "none"}/>
            {event.upvotes}
            </button>

            <button
            className={`flex items-center gap-1 text-xs transition
                ${event.hasDownvoted ? "text-orange-600" : "hover:text-orange-600"}
            `}
            onClick={(e) => {
                e.stopPropagation()
                onDownvote(event.id)
            }}
            >
            <ThumbsDown size={14} fill={event.hasDownvoted ? "currentColor" : "none"}/>
            {event.downvotes}
            </button>
        </div>

        </div>
    </div>
    )}
  </div>
  );
}