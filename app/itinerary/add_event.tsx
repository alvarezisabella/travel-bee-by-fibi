"use client"
import {useState} from "react"
import {Event, EventLabel} from "./event"
import { EventCard } from "./event"


interface AddEventProps {
  day: string
  onClose: () =>void;
  onAdd: (event: Omit<Event, "id">) => void;
}

export default function AddEvent({day, onClose, onAdd}: AddEventProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [duration, setDuration] = useState(60)
  const [type, setType] = useState<EventLabel>("outdoors")

    const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({ dayid:day, title: title.trim(), description: description.trim(), startTime, duration, type });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50flex items justify-center">
      <div 
        className="absolute inset-0 bg-[#f5f5f5]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="px-6 py-5 space-y-4">
      {/* Title */}
        <div>
        <label className="block text-[#1a1812] text-xs tracking-[0.15em] uppercase font-medium mb-1.5">
          Event Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-white border border-[#d4c9b0] rounded-lg px-3.5 py-2.5 text-[#1a1812] placeholder-[#b0a48a] text-sm focus:outline-none focus:border-[#8a7d5a] transition-colors"
          />
        </div>

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
              className="w-full bg-white border border-[#d4c9b0] rounded-lg px-3.5 py-2.5 text-[#1a1812] placeholder-[#b0a48a] text-sm focus:outline-none focus:border-[#8a7d5a] transition-colors resize-none"
            />
          </div>

          {/*event type/label */}

          {/*Time & Duration*/}

          {/*Save & Cancel */}
      </div>    
    </div>
  );
}