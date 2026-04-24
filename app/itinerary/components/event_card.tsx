"use client"
import {useState} from "react";
import { ThumbsUp, ThumbsDown, Trash2, Dot, Clock, MapPin } from "lucide-react"
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

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
<div
  className="max-w-5xl relative flex gap-3.5 bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 text-gray-800"
  style={{
    borderWidth: hovered? "3px" : "0.5px",
    borderColor: hovered? "rgba(250, 197, 37, 0.5)" : "#c9c9c9",
    boxShadow: hovered ? "0px 2px 10px rgba(250, 197, 37, 0.4)" : "0 2px 16px rgba(0,0,0,0.07)",
    pointerEvents: isLockedByOther ? "none" : "all",
  }}
  onClick={handleEdit}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>
  {/* Left accent bar */}
  <div className={`w-1 rounded-full  ${status_bg.bg} flex-shrink-0 self-stretch`} />

  <div className="flex-1 min-w-0 flex flex-col gap-2">

    {/* Title */}
    <div className="flex items-start justify-between gap-2">
      <h4 className="font-medium text-[20px] text-primary tracking-tight truncate">
        {event.title}
      </h4>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Status */}
        <span 
        style={{"--bg": status_bg.bg} as React.CSSProperties}
        className={`flex items-center justify-center text-[13px] ${status_bg.dot} font-extrabold pr-3 py-0.5 rounded-full bg-[rgb(var(--bg)/0.3)] tracking-wide whitespace-nowrap shadow-md`}>
         <Dot size={30}/> {event.status}
        </span>
        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
          style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}
          className="p-1 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-colstyle={colors:{ Text:${status_bg.dot} }}> cursor-pointer hover:bg-red-200 hover:text-red-800 flex-shrink-0"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>

    {/* Type/label */}
    <span className={`self-start text-[11px] font-semibold  px-2.5 py-1 rounded-md tracking-wide ${colors.bg} ${colors.text} shadow-md`}>
      {event.type}
    </span>

    {/* Description */}
    {event.description && (
      <p className="text-[13px] text-secondary leading-relaxed whitespace-pre-wrap">
        {event.description}
      </p>
    )}

    {/* time & duration */}
    <div className="flex items-center justify-between mt-1 ">
      <div className="flex items-center gap-1.5 text-[12px] text-tertiary shadow-md rounded-xl p-2">
        <Clock size={15}/>
        <span className="pt-0.5">{formatTime(event.startTime)}</span>
        <span className="opacity-80 pt-0.5">·</span>
        <span className="pt-0.5">{formatDuration(event.duration)}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          className={`flex items-center gap-1 text-[12px] px-1.5 py-0.5 rounded-md transition-colors
            ${event.hasUpvoted ? "text-emerald-600" : "text-muted hover:text-emerald-600 hover:bg-emerald-50"}`}
          onClick={(e) => { e.stopPropagation(); onUpvote(event.id); }}
        >
          <ThumbsUp size={15} fill={event.hasUpvoted ? "currentColor" : "none"} />
          {event.upvotes}
        </button>
        <div className="w-px h-3.5 bg-border" />
        <button
          className={`flex items-center gap-1 text-[12px] px-1.5 py-0.5 rounded-md transition-colors
            ${event.hasDownvoted ? "text-orange-500" : "text-muted hover:text-orange-500 hover:bg-orange-50"}`}
          onClick={(e) => { e.stopPropagation(); onDownvote(event.id); }}
        >
          <ThumbsDown size={15} fill={event.hasDownvoted ? "currentColor" : "none"} />
          {event.downvotes}
        </button>
      </div>
    </div>

  </div>
</div>
    )}
  </div>
  );
}