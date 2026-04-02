"use client"
import {useState} from "react"
import {Event, EventStatus, EventLabel} from "../types/types"
import { emptyEvent } from "../types/types"
import { Traveler } from "../types/types"
import { Trip } from "../types/types"
import LocationSearch from "./LocationSearch"
import {
  MapPin, Users, Tag, CalendarCheck, Clock, TimerIcon
} from "lucide-react"


interface EditEventProps {
  day: string
  date?: string
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

export default function EditEvent({day, date, trip, event, members, onClose, onSave}: EditEventProps) {
    // variables that can be entered when adding an event
    // title is required
    const [altEvent, setEvent] = useState<Event>(event? event : emptyEvent)
    const [editingLocation, setEditingLocation] = useState(false)
    const [travelers, setTravelers] = useState<string[]>(() => {
    if (!event?.travelers || !members?.length) return []
    const names = event.travelers.split(', ').filter(Boolean)
    return members.filter(m => names.includes(m.name)).map(m => m.id)
    })
    altEvent.dayid=day
    altEvent.itineraryid=trip

    const handleChange = (field: string, value: any) => {
        setEvent((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    
    const handleSubmit = async () => {
        if (!altEvent.title.trim()) return;

        // Calls POST (insert) or PUT (update) function from api/auth/event with event variables and trip id
        const res = await fetch("/api/auth/event", {
        method: event ? "PUT" : "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: event?.id, itineraryid: trip, day: date, title: altEvent.title.trim(), description: altEvent.description.trim(), status: altEvent.status, startTime: altEvent.startTime, duration:altEvent.duration, location:altEvent.location, type:altEvent.type, travelers})})

        // If unsuccessful, logs error. If successful, calls onAdd with new event details and closes add event card
        const data = await res.json()
        if(!res.ok) {console.error(data.error); return;}

        const eventId = event ? event.id : data.event.id
        const travelerNames = (members ?? []).filter(m => travelers.includes(m.id)).map(m => m.name).join(', ')
        altEvent.id = eventId
        altEvent.travelers = travelerNames
        onSave(altEvent);
        onClose();
    };

    return (
    <div className={`max-w-5xl relative flex gap-3 ${cardColor.bg} rounded-xl p-6`}
        style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)"}}>
        <div className={`w-1 rounded-full ${cardColor.bar} flex-shrink-0`} />

        {/*Status*/}
        <div className="absolute top-7 right-8">
            <div className="flex gap-4 flex-wrap border border-[#e3e3e3] p-2 rounded-xl shadow-sm">
                <div className="relative top-1 flex-shrink-0"><CalendarCheck size={16}/></div>  
                {STATUS_COLORS.map((c) => (
                <div key={c.value} className="flex flex-col items-center">
                <button
                    onClick={() => handleChange("status", c.value as EventStatus)}
                    className={`max-w-24 h-6 rounded-xl ${c.bg} shadow-sm transition-all transform duration-200 ease-in-out
                    ${altEvent.status === c.value ? "ring ring-offset-2 ring-[#1a1812] scale-105" : "hover:scale-120"}`}
                    style={{fontFamily:"Helvetica"}}
                >
                <span className="px-2 py-1 text-white text-xs">{c.value}</span>
                </button>
                </div>
                ))}                
            </div>
        </div>


        {/*Event Title*/}
        <div className="flex-1 min-w-0 space-y-1.5 ">
        <div className="flex items-start justify-between gap-2 px-2">
            <input 
                type="text"
                value={altEvent.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Add Title *"
                className={`font-medium text-md ${cardColor.text} focus:outline-none focus:border-[#ffbd2e] transition-colors`} style={{ fontFamily: "Helvetica, serif" }}
            />
        </div>

        {/*Type*/}
        <div className="p-2">
            <div className="flex gap-4 flex-wrap">
                <div className="relative top-1.5 flex-shrink-0"><Tag size={16}/></div>              
                {EVENT_COLORS.map((c) => (
                <div key={c.value} className="flex flex-col items-center">
                <button
                    onClick={() => handleChange("type", c.value)}
                    className={`max-w-24 h-6 rounded-sm ${c.bg} shadow-sm transition-all transform duration-200 ease-in-out
                    ${altEvent.type === c.value ? `ring ring-offset-2 ${c.ring} scale-105` : "hover:scale-120"}`}
                    style={{fontFamily:"Helvetica"}}
                >
                <span className={`px-2 py-1 ${c.text} text-xs`}>{c.label}</span>
                </button>
                </div>
                ))}                
            </div>
        </div>        


        {/*Description*/}
        <div className="p-2">
            <textarea
              value={altEvent.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Add details..."
              rows={3}
              style={{fontFamily: "Georgia, serif"}}
              className={`w-full bg-white border border-[#e3e3e3] rounded-lg px-3.5 py-2.5 ${cardColor.time} placeholder-[#b0a48a] text-xs mt-1 opacity-80 focus:outline-none focus:border-[#8a7d5a] transition-colors`}
            />
        </div>

        {/*Time & Duration*/}

          <div className="grid grid-cols-4 gap-3 px-2 py-1">
            <div>
              <label className="block text-[#1a1812] text-xs uppercase font-medium mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={altEvent.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                className={`w-full bg-white border border-[#e3e3e3] ${cardColor.time} rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#e3e3e3] transition-colors`}
              />
            </div>
            <div>
              <label className="block text-[#1a1812] text-xs uppercase font-medium mb-1.5">
                Duration
              </label>
              <select
                value={altEvent.duration}
                onChange={(e) => handleChange("duration", Number(e.target.value))}
                className={`w-full bg-white border border-[#e3e3e3] rounded-lg px-3.5 py-2.5 ${cardColor.time} text-xs focus:outline-none focus:border-[#8a7d5a] transition-colors`}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>All day</option>
              </select>
            </div>
          </div>

        {/*Location*/}
        <div className="flex space-x-4 items-center px-2 py-1">
          <div className="flex-shrink-0"><MapPin size={16}/></div>
          {editingLocation ? (
            <LocationSearch
              value={altEvent.location}
              onChange={(val) => handleChange("location", val)}
              onClose={() => setEditingLocation(false)}
            />
            ) : (
              <span
                className={`cursor-pointer opacity-80 text-sm`}
                onClick={() => setEditingLocation(true)}>
                {altEvent.location || "Add location"}
              </span>)}
        </div>  

        <div className="flex space-x-4 items-start p-2">
          <div className="flex-shrink-0 mt-1"><Users size={16} /></div>
          <div className="flex flex-col gap-2 w-full">
            {(members ?? []).length === 0 && (
              <span className="text-sm text-[#b0a48a]">No members on this trip yet.</span>
            )}
            {(members ?? []).length > 0 && travelers.length === 0 && (
              <span className="text-sm text-[#b0a48a]">@traveler...</span>
            )}
            <div className="flex flex-wrap gap-2">
              {(members ?? []).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTravelers(prev =>
                    prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                  )}
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    travelers.includes(m.id)
                      ? 'bg-[#fac643] border-[#fac643] text-white'
                      : 'bg-white border-[#e3e3e3] text-[#1a1812] hover:border-[#fac643]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
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
                disabled={!altEvent.title.trim()}
                className="flex-1 bg-[#fac643] text-[#ffffff] rounded-lg py-2.5 text-sm tracking-wide hover: transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
    
          </div> 
          </div> 
      );
}