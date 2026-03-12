"use client"
import {useState} from "react"
import {Event, EventLabel} from "./event"
import { EventCard } from "./event"


interface AddEventProps {
  day: string
  event?: Event
  onClose: () =>void;
  onAdd: (event: Event) => void;
}

export default function AddEvent({day, event, onClose, onAdd}: AddEventProps) {
  const [title, setTitle] = useState(event?.title || "")
  const [description, setDescription] = useState(event?.description || "")
  const [startTime, setStartTime] = useState(event?.startTime || "09:00")
  const [duration, setDuration] = useState(event?.duration || 60)
  const [type, setType] = useState<EventLabel>(event?.type || "Activity")
  const [status, setStatus] = useState(event?.status || "Pending")

    const handleSubmit = () => {
      if (!title.trim()) return;
      onAdd({ id:event?.id || crypto.randomUUID(), dayid:day, title: title.trim(), description: description.trim(), status: status, startTime, duration, type });
      onClose();
  };

  const EVENT_COLORS: { value: EventLabel; label: string; bg: string; border: string }[] = [
  { value: "Activity",     label: "Activity",        bg: "bg-[#8fad9b]", border: "border-[#8fad9b]" },
  { value: "Transit",      label: "Transit",         bg: "bg-[#7a8fa6]", border: "border-[#7a8fa6]" },
  { value: "Reservation",  label: "Reservation",     bg: "bg-[#c9a84c]", border: "border-[#c9a84c]" },
  { value: "Food",         label: "Food",            bg: "bg-[#b87a8a]", border: "border-[#b87a8a]" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-left">
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
          <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-medium mb-1.5">
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

          {/*event type/label */}
          <div>
            <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-medium mb-2">
              Event Label
            </label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setType(c.value)}
                  className={`w-8 h-8 rounded-full ${c.bg} transition-transform ${
                    type === c.value ? "scale-125 ring-2 ring-offset-2 ring-[#1a1812]" : "hover:scale-110"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

           <div>
              <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-medium mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-[#e3e3e3] rounded-lg px-3.5 py-2.5 text-[#1a1812] text-sm focus:outline-none focus:border-[#e3e3e3] transition-colors"
              >
                <option value={"Idea"}>Idea</option>
                <option value={"Pending"}>Pending</option>
                <option value={"Confirmed"}>Confirmed</option>
              </select>
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