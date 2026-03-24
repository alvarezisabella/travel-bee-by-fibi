"use client"
import {useState} from "react"
import {Event, EventLabel} from "./event"
import { EventCard, EventStatus} from "./event"
import { Traveler } from "./types/trips"
import LocationSearch from "./components/LocationSearch"
import {
  MapPin, Calendar, Users, List, CalendarDays, Map, Bookmark,
  X, Copy, Check
} from "lucide-react"


interface AddEventProps {
  day: string
  date?: string
  trip: string
  event?: Event
  members?: Traveler[]
  onClose: () =>void;
  onAdd: (event: Event) => void;
}

// Design for add event card and routing for adding an event 
export default function AddEvent({day, date, trip, event, members, onClose, onAdd}: AddEventProps) {
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
  const [travelers, setTravelers] = useState<string[]>(() => {
    if (!event?.travelers || !members?.length) return []
    const names = event.travelers.split(', ').filter(Boolean)
    return members.filter(m => names.includes(m.name)).map(m => m.id)
  })

  // Handle form submission for adding events
  // If title not provided, does not submit
  const handleSubmit = async () => {
    if (!title.trim()) return;

    // Calls POST (insert) or PUT (update) function from api/auth/event with event variables and trip id
    const res = await fetch("/api/auth/event", {
      method: event ? "PUT" : "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: event?.id, itineraryid: trip, dayid: day, day: date, title: title.trim(), description: description.trim(), status, startTime, duration, location, type, travelers})
    })

    // If unsuccessful, logs error. If successful, calls onAdd with new event details and closes add event card
    const data = await res.json()
    if(!res.ok) {console.error(data.error); return;}

    const eventId = event ? event.id : data.event.id
    const travelerNames = (members ?? []).filter(m => travelers.includes(m.id)).map(m => m.name).join(', ')
    onAdd({ id: eventId, itineraryid:trip, dayid:day, title: title.trim(), description: description.trim(), status: status, startTime, duration, location, travelers: travelerNames, type, upvotes:0, downvotes:0 });
    onClose();
  };

  // Color options for event type and status with corresponding labels and styles
  const EVENT_COLORS: { value: EventLabel; label: string; bg: string; border: string }[] = [
  { value: "Activity",     label: "Activity",        bg: "bg-[#8fad9b]", border: "border-[#8fad9b]" },
  { value: "Transit",      label: "Transit",         bg: "bg-[#7a8fa6]", border: "border-[#7a8fa6]" },
  { value: "Reservation",  label: "Reservation",     bg: "bg-[#c9a84c]", border: "border-[#c9a84c]" },
  { value: "Food",         label: "Food",            bg: "bg-[#b87a8a]", border: "border-[#b87a8a]" },
  ];

  // Color options for event status with corresponding labels and styles
  const STATUS_COLORS: {value: EventStatus; bg: string}[] = [
    {value: "Idea", bg: "bg-[#9c8a8a]"},
    {value: "Pending", bg: "bg-[#ffcd59]"},
    {value: "Confirmed", bg: "bg-[#98d99f]"}
  ]

  // Design for add event card, includes form fields for event variables, 
  // buttons to select event type and status, and save/cancel buttons
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start">
      <div 
        className="absolute inset-0 bg-[#f5f5f5]/60 "
        onClick={onClose}
      />

        <div className='relative bg-[#ffffff] border border-[#e3e3e3] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden'>
        {/* Header  & Title */}
        <div className="bg-[#fac643] px-6 py-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add Title *"
            className="w-full rounded-lg px-3.5 py-2.5 text-[#ffffff] placeholder-[#ffffff] text-2xl font-serif focus:outline-none focus:border-[#ffbd2e] transition-colors"
          />
        </div>

      <div className="px-6 py-6 space-y-8">

        {/* Description */}
        <div>
          <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-md mb-1.5">
            Description
          </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className="w-full bg-white border border-[#e3e3e3] rounded-lg px-3.5 py-2.5 text-[#1a1812] placeholder-[#b0a48a] text-sm focus:outline-none focus:border-[#8a7d5a] transition-colors resize-none"
            />
          </div>

          {/*Time & Duration*/}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-medium mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white border border-[#e3e3e3] rounded-lg px-3.5 py-2.5 text-[#1a1812] text-sm focus:outline-none focus:border-[#e3e3e3] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-medium mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-white border border-[#e3e3e3] rounded-lg px-3.5 py-2.5 text-[#1a1812] text-sm focus:outline-none focus:border-[#8a7d5a] transition-colors"
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



        <div className="flex space-x-4 items-start">
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

        <div className="flex space-x-4 items-center">
          <div className="flex-shrink-0"><MapPin size={16} /></div>
          
          {editingLocation ? (
            <LocationSearch
              value={location}
              onChange={(val) => setLocation(val)}
              onClose={() => setEditingLocation(false)}
            />
            ) : (
              <span
                className="cursor-pointer hover:text-black"
                onClick={() => setEditingLocation(true)}>
                {location || "Add location"}
              </span>)}
        </div>  
        
        {/*event status*/}
          <div>
            <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-medium mb-2">
              Status
            </label>
            <div className="flex gap-4 flex-wrap">
              {STATUS_COLORS.map((c) => (
              <div key={c.value} className="flex flex-col items-center">
                <button
                  onClick={() => setStatus(c.value as EventStatus)}
                  className={`w-8 h-8 rounded-full ${c.bg} transition-all transform duration-200 ease-in-out
                  ${status === c.value ? "ring ring-offset-2 ring-[#1a1812] scale-110" : "hover:scale-130"}`}
                  title={c.value}
                />
                <span className="text-xs mt-2 text-[#1a1812]">{c.value}</span>
              </div>
              ))}
            </div>
          </div>                 

          {/*event type/label */}
          <div>
            <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-medium mb-2">
              Event Label
            </label>
            <div className="flex gap-4 flex-wrap">
              {EVENT_COLORS.map((c) => (
              <div key={c.value} className="flex flex-col items-center">
                <button
                  onClick={() => setType(c.value)}
                  className={`w-8 h-8 rounded-full ${c.bg} transition-all transform duration-200 ease-in-out
                  ${type === c.value ? "ring ring-offset-2 ring-[#1a1812] scale-120" : "hover:scale-130"}`}
                  title={c.label}
                />
                <span className="text-xs mt-2 text-[#1a1812]">{c.label}</span>
              </div>
              ))}
            </div>
          </div>


          {/*Save & Cancel */}
          <div className="px-6 pb-5 flex gap-3">
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
    </div>
  );
}