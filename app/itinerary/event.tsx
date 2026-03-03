"use client"
import {useState} from "react";
export interface Event {
    id: string
    dayid: string
    tripid: string
    title: string
    description: string
    startTime: string
    duration: number
    type: EventLabel;
}

interface EventCardProp {
    event: Event;
    onDelete: (id: string) => void
}

export type EventLabel = "shopping" | "transportation" | "food" | "outdoors" | "cultural"

const LABEL_MAP: Record<EventLabel, { bg: string; bar: string; text: string; time: string }> = {
  shopping:  { bg: "bg-[#eef4f0]", bar: "bg-[#8fad9b]", text: "text-[#3a5a46]", time: "text-[#6a9078]" },
  transportation:  { bg: "bg-[#f9eeec]", bar: "bg-[#c17c6e]", text: "text-[#6a2e22]", time: "text-[#a05a4e]" },
  food: { bg: "bg-[#edf0f4]", bar: "bg-[#7a8fa6]", text: "text-[#2a3d52]", time: "text-[#5a7090]" },
  outdoors: { bg: "bg-[#f8f3e6]", bar: "bg-[#c9a84c]", text: "text-[#5a420a]", time: "text-[#8a6820]" },
  cultural:  { bg: "bg-[#f8eff2]", bar: "bg-[#b87a8a]", text: "text-[#5a2234]", time: "text-[#905060]" },
};


function EventCard({ event, onDelete }: EventCardProp) {
  const [hovered, setHovered] = useState(false);
  const colors = LABEL_MAP[event.type];


  return (
    <div
      className={`relative flex gap-3 ${colors.bg} rounded-xl p-3.5 border border-black/5 transition-shadow`}
      style={{ boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "none" }}
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
            onClick={() => onDelete(event.id)}
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

const SAMPLE_EVENTS:Event[] = [
    { id: "1", dayid: "1", tripid: "guest", title: "Morning Event", description: "detail1.", startTime: "09:00", duration: 30, type: "outdoors" },
    { id: "2", dayid: "1", tripid: "guest", title: "brunch", description: "detail2", startTime: "11:00", duration: 60, type: "food" },
    { id: "3", dayid: "1", tripid: "guest", title: "shopping event", description: "", startTime: "12:30", duration: 90, type: "shopping" },
    { id: "4", dayid: "1", tripid: "guest", title: "afternoon event", description: "detail3", startTime: "14:00", duration: 120, type: "transportation" },
    { id: "5", dayid: "1", tripid: "guest", title: "evening time", description: "", startTime: "18:00", duration: 60, type: "cultural" },
  ]

export default function EventCardPreview() {
  const [events, setEvents] = useState<Event[]>(SAMPLE_EVENTS);

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-[#1a1812] text-4xl">Day 1</h1>
        </div>

        <div className="space-y-2.5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onDelete={handleDelete} />
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center text-[#b0a48a] text-sm py-12">
            All events deleted"
          </div>
        )}
    
      </div>
    </div>
  );
}