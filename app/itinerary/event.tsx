"use client"
import {useState} from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react"


import { Traveler } from "./types/trips";
export interface Event {
    id: string
    tripid: string
    dayid: string
    title: string
    description: string
    status: EventStatus
    startTime: string
    duration: number
    location: string
    travelers: string
    type: EventLabel;
    upvotes: number
    downvotes: number
    hasUpvoted?: boolean
    hasDownvoted?: boolean
}

interface EventCardProp {
    event: Event;
    onDelete: (eventid: string) => void
    onOpen: (eventid: string) => void
    onUpvote: (eventid: string) => void
    onDownvote: (eventid: string) => void
}

export type EventLabel = "Activity" | "Transit" | "Reservation" | "Food" 
export type EventStatus = "Pending" | "Confirmed" | "Idea"

const LABEL_MAP: Record<EventLabel, { bg: string; bar: string; text: string; time: string }> = {
  Activity:  { bg: "bg-[#eef4f0]", bar: "bg-[#8fad9b]", text: "text-[#3a5a46]", time: "text-[#6a9078]" },
  Transit: { bg: "bg-[#edf0f4]", bar: "bg-[#7a8fa6]", text: "text-[#2a3d52]", time: "text-[#5a7090]" },
  Reservation: { bg: "bg-[#f8f3e6]", bar: "bg-[#c9a84c]", text: "text-[#5a420a]", time: "text-[#8a6820]" },
  Food:  { bg: "bg-[#f8eff2]", bar: "bg-[#b87a8a]", text: "text-[#5a2234]", time: "text-[#905060]" },
};
const cardColor = {bg: "bg-[#fcfcfc]", bar: "bg-[#dbdbdb]", text: "text-[#262626]", time: "text-[#3a4042]"}
const STATUS_MAP: Record<EventStatus, string> = {
  Confirmed: "bg-[#98d99f]",
  Pending: "bg-[#ffcd59]",
  Idea:     "bg-[#9c8a8a]"
}


export function EventCard({ event, onDelete, onOpen, onUpvote, onDownvote }: EventCardProp) {
  const [hovered, setHovered] = useState(false);
  const colors = LABEL_MAP[event.type];
  const status_bg = STATUS_MAP[event.status]

  return (
    <div
      className={`max-w-5xl relative flex gap-3 ${cardColor.bg} rounded-xl p-3.5 border border-[#c9c9c9] transition-shadow`}
      style={{ boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "none" }}
      onClick={() => onOpen(event.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`w-1 rounded-full ${cardColor.bar} flex-shrink-0`} />

      <div 
        style={{fontFamily:"Helvetica"}}
        className={`absolute top-2 right-8 max-w-24 rounded-xl ${status_bg} shadow-sm items-center justify-center`}>
        <h4 className="px-2 py-1 text-white text-xs">{event.status}</h4>
      </div>



      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`font-medium text-md ${cardColor.text} truncate`} style={{ fontFamily: "Helvetica, serif" }}>
            {event.title}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(event.id)
            }}
            style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}
            className="text-[#b0a48a] hover:text-[#c17c6e] text-lg leading-none flex-shrink-0 -mt-0.5"
          >
            ×
          </button>
        </div>

        <div className={`max-w-24 rounded-sm py-1 ${colors.bg} flex items-center justify-center`}>
            <h4 className={`text-xs ${colors.text} opacity-100`}>{event.type}</h4>
        </div>
        {event.description && (
          <p className={`text-xs mt-1 ${cardColor.time} opacity-80`} style={{ fontFamily: "Georgia, serif" }}>
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
            className="flex items-center gap-1 text-xs hover:text-green-600"
            onClick={(e) => {
              e.stopPropagation()
              onUpvote(event.id)
            }}
          >
            <ThumbsUp size={14} />
            {event.upvotes}
          </button>

          <button
            className="flex items-center gap-1 text-xs hover:text-orange-600"
            onClick={(e) => {
              e.stopPropagation()
              onDownvote(event.id)
            }}
          >
            <ThumbsDown size={14} />
            {event.downvotes}
          </button>
        </div>

      </div>
    </div>
  );
}
