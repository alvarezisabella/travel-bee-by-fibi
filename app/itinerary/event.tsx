"use client"
import {useState} from "react";
export interface Event {
    id: string
    dayid: string
    title: string
    description: string
    status: string
    startTime: string
    duration: number
    type: EventLabel;
}

interface EventCardProp {
    event: Event;
    onDelete: (eventid: string) => void
    onOpen: (eventid: string) => void
}

export type EventLabel = "Activity" | "Transit" | "Reservation" | "Food" 

const LABEL_MAP: Record<EventLabel, { bg: string; bar: string; text: string; time: string }> = {
  Activity:  { bg: "bg-[#eef4f0]", bar: "bg-[#8fad9b]", text: "text-[#3a5a46]", time: "text-[#6a9078]" },
  Transit: { bg: "bg-[#edf0f4]", bar: "bg-[#7a8fa6]", text: "text-[#2a3d52]", time: "text-[#5a7090]" },
  Reservation: { bg: "bg-[#f8f3e6]", bar: "bg-[#c9a84c]", text: "text-[#5a420a]", time: "text-[#8a6820]" },
  Food:  { bg: "bg-[#f8eff2]", bar: "bg-[#b87a8a]", text: "text-[#5a2234]", time: "text-[#905060]" },
};


export function EventCard({ event, onDelete, onOpen }: EventCardProp) {
  const [hovered, setHovered] = useState(false);
  const colors = LABEL_MAP[event.type];


  return (
    <div
      className={`relative flex gap-3 ${colors.bg} rounded-xl p-3.5 border border-black/5 transition-shadow`}
      style={{ boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "none" }}
      onClick={() => onOpen(event.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`w-1 rounded-full ${colors.bar} flex-shrink-0`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`font-medium text-sm ${colors.text} truncate`} style={{ fontFamily: "Georgia, serif" }}>
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

        {event.description && (
          <p className={`text-xs mt-1 ${colors.time} opacity-80`} style={{ fontFamily: "Georgia, serif" }}>
            {event.description}
          </p>
        )}

        <div className={`flex items-center gap-1.5 mt-2 text-xs ${colors.time}`}>
          <span>{event.startTime}</span>
          <span className="opacity-40">·</span>
          <span>{event.duration}</span>
        </div>
      </div>
    </div>
  );
}
