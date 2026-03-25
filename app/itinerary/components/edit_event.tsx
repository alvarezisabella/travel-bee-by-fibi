"use client"
import {useState} from "react"
import {Event, EventLabel} from "./event_card"
import { EventCard, EventStatus} from "./event_card"
import { Traveler } from "../types/trips"
import { Trip } from "../types/trips"
import LocationSearch from "./LocationSearch"
import {
  MapPin, Users, Tag, CalendarCheck
} from "lucide-react"


interface EditEventProps {
  day: string
  trip: string
  event?: Event
  members?: Traveler[]
  onClose: () =>void;
  onSave: (event: Event) => void;
}
const cardColor = {bg: "bg-[#fcfcfc]", bar: "bg-[#dbdbdb]", text: "text-[#262626]", time: "text-[#3a4042]"}
const EVENT_COLORS: { value: EventLabel; label: string; bg: string; text: string , ring:string}[] = [
{ value: "Activity",     label: "Activity",        bg: "bg-[#eef4f0]", text: "text-[#3a5a46]", ring: "ring-[#3a5a46]"},
{ value: "Transit",      label: "Transit",         bg: "bg-[#edf0f4]", text: "text-[#2a3d52]", ring: "ring-[#2a3d52]"},
{ value: "Reservation",  label: "Reservation",     bg: "bg-[#f8f3e6]", text: "text-[#5a420a]", ring: "ring-[#5a420a]"},
{ value: "Food",         label: "Food",            bg: "bg-[#f8eff2]", text: "text-[#5a2234]", ring: "ring-[#5a2234]"},
];

// Color options for event status with corresponding labels and styles
const STATUS_COLORS: {value: EventStatus; bg: string}[] = [
    {value: "Idea", bg: "bg-[#9c8a8a]"},
    {value: "Pending", bg: "bg-[#ffcd59]"},
    {value: "Confirmed", bg: "bg-[#98d99f]"}
]
const STATUS_MAP: Record<EventStatus, string> = {
  Confirmed: "bg-[#98d99f]",
  Pending: "bg-[#ffcd59]",
  Idea:     "bg-[#9c8a8a]"
}
const LABEL_MAP: Record<EventLabel, { bg: string; bar: string; text: string; time: string }> = {
  Activity:  { bg: "bg-[#eef4f0]", bar: "bg-[#8fad9b]", text: "text-[#3a5a46]", time: "text-[#6a9078]" },
  Transit: { bg: "bg-[#edf0f4]", bar: "bg-[#7a8fa6]", text: "text-[#2a3d52]", time: "text-[#5a7090]" },
  Reservation: { bg: "bg-[#f8f3e6]", bar: "bg-[#c9a84c]", text: "text-[#5a420a]", time: "text-[#8a6820]" },
  Food:  { bg: "bg-[#f8eff2]", bar: "bg-[#b87a8a]", text: "text-[#5a2234]", time: "text-[#905060]" },
};

export default function EditEvent({day, trip, event, members, onClose, onSave}: EditEventProps) {
    // variables that can be entered when adding an event
    // title is required
    const [title, setTitle] = useState(event?.title || "")
    const [description, setDescription] = useState(event?.description || "")
    const [startTime, setStartTime] = useState(event?.startTime || "09:00")
    const [duration, setDuration] = useState(event?.duration || 60)
    const [type, setType] = useState<EventLabel>(event?.type || "Activity")
    const [status, setStatus] = useState(event?.status || "Pending")
    const [location, setLocation] = useState(event?.location || "")
    const [editingLocation, setEditingLocation] = useState(false)
    const colors = LABEL_MAP[type];
    const status_bg = STATUS_MAP[status]
    const [travelers, setTravelers] = useState<string[]>(() => {
    if (!event?.travelers || !members?.length) return []
    const names = event.travelers.split(', ').filter(Boolean)
    return members.filter(m => names.includes(m.name)).map(m => m.id)
    })

    const handleSubmit = async () => {
    if (!title.trim()) return;

    // Calls POST (insert) or PUT (update) function from api/auth/event with event variables and trip id
    const res = await fetch("/api/auth/event", {
      method: event ? "PUT" : "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: event?.id, itineraryid: trip, day: day, title: title.trim(), description: description.trim(), status, startTime, duration, location, type, travelers})
    })

    // If unsuccessful, logs error. If successful, calls onAdd with new event details and closes add event card
    const data = await res.json()
    if(!res.ok) {console.error(data.error); return;}

    const eventId = event ? event.id : data.event.id
    const travelerNames = (members ?? []).filter(m => travelers.includes(m.id)).map(m => m.name).join(', ')
    onSave({ id: eventId, itineraryid:trip, dayid:day, title: title.trim(), description: description.trim(), status: status, startTime, duration, location, travelers: travelerNames, type, upvotes:0, downvotes:0 });
    onClose();
  };

    return (
    <div className={`max-w-5xl relative flex gap-3 ${cardColor.bg} rounded-xl p-6 transition-shadow `}
        style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)"}}>
        <div className={`w-1 rounded-full ${cardColor.bar} flex-shrink-0`} />

        {/*Status*/}
        <div className="absolute top-7 right-8">
            <div className="flex gap-4 flex-wrap border border-[#e3e3e3] p-2 rounded-xl shadow-sm">
                <div className="relative top-1 flex-shrink-0"><CalendarCheck size={16}/></div>  
                {STATUS_COLORS.map((c) => (
                <div key={c.value} className="flex flex-col items-center">
                <button
                    onClick={() => setStatus(c.value as EventStatus)}
                    className={`max-w-24 h-6 rounded-xl ${c.bg} shadow-sm transition-all transform duration-200 ease-in-out
                    ${status === c.value ? "ring ring-offset-2 ring-[#1a1812] scale-105" : "hover:scale-120"}`}
                    style={{fontFamily:"Helvetica"}}
                >
                <span className="px-2 py-1 text-white text-xs">{c.value}</span>
                </button>
                </div>
                ))}                
            </div>
        </div>


        {/*Event Title*/}
        <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
            <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add Title *"
                className={`font-medium text-md ${cardColor.text} focus:outline-none focus:border-[#ffbd2e] transition-colors`} style={{ fontFamily: "Helvetica, serif" }}
            />
        </div>

        {/*Type/Classification*/}
        <div className="p-2">
            <div className="flex gap-4 flex-wrap">
                <div className="relative top-1.5 flex-shrink-0"><Tag size={16}/></div>              
                {EVENT_COLORS.map((c) => (
                <div key={c.value} className="flex flex-col items-center">
                <button
                    onClick={() => setType(c.label as EventLabel)}
                    className={`max-w-24 h-6 rounded-sm ${c.bg} shadow-sm transition-all transform duration-200 ease-in-out
                    ${type === c.label ? `ring ring-offset-2 ${c.ring} scale-105` : "hover:scale-120"}`}
                    style={{fontFamily:"Helvetica"}}
                >
                <span className={`px-2 py-1 ${c.text} text-xs`}>{c.label}</span>
                </button>
                </div>
                ))}                
            </div>
        </div>        


        {/*Description*/}
        <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              style={{fontFamily: "Georgia, serif"}}
              className={`w-full bg-white border border-[#e3e3e3] rounded-lg px-3.5 py-2.5 ${cardColor.time} placeholder-[#b0a48a] text-xs mt-1 opacity-80 focus:outline-none focus:border-[#8a7d5a] transition-colors`}
            />
        </div>

        {/*Time & Duration*/}
        <div className={`flex items-center gap-1.5 mt-2 text-xs ${cardColor.time}`}>
            <span>{startTime}</span>
            <span className="opacity-40">·</span>
            <span>{duration}</span>
        </div>
    
              {/*Save & Cancel */}
              <div className="px-6 py-5 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-[#e3e3e3] text-[#8a7d5a] rounded-lg py-2.5 text-sm tracking-wide hover:bg-[#f5f3f0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="flex-1 bg-[#fac643] text-[#ffffff] rounded-lg py-2.5 text-sm tracking-wide hover: transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
    
          </div> 
          </div> 
      );
}