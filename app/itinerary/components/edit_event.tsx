"use client"
import { useState, useEffect } from "react"
import { Event, EventStatus, EventLabel, emptyEvent, Traveler, Trip } from "../types/types"
import LocationSearch from "./LocationSearch"
import { MapPin, Users, Tag, CalendarCheck, Clock, Loader2 } from "lucide-react"

interface EditEventProps {
  day: string
  date?: string
  trip: string
  event?: Event
  initialStartTime?: string
  members?: Traveler[]
  onClose: () => void
  onSave: (event: Event) => void
  onTimeChange?: (startTime: string, duration: number) => void
}

const cardColor = { bg: "bg-[#fcfcfc]", bar: "bg-[#dbdbdb]", text: "text-[#262626]", time: "text-[#3a4042]" }

const EVENT_COLORS: { value: EventLabel; label: string; bg: string; text: string; ring: string }[] = [
  { value: "Activity",    label: "Activity",    bg: "bg-[#eef4f0]", text: "text-[#3a5a46]", ring: "ring-[#3a5a46]" },
  { value: "Transit",     label: "Transit",     bg: "bg-[#edf0f4]", text: "text-[#2a3d52]", ring: "ring-[#2a3d52]" },
  { value: "Reservation", label: "Reservation", bg: "bg-[#f8f3e6]", text: "text-[#5a420a]", ring: "ring-[#5a420a]" },
  { value: "Food",        label: "Food",        bg: "bg-[#f8eff2]", text: "text-[#5a2234]", ring: "ring-[#5a2234]" },
]

const STATUS_COLORS: { value: EventStatus; bg: string }[] = [
  { value: "Idea",      bg: "bg-[#9c8a8a]" },
  { value: "Pending",   bg: "bg-[#ffcd59]" },
  { value: "Confirmed", bg: "bg-[#98d99f]" },
]

export default function EditEvent({ day, date, trip, event, initialStartTime, members, onClose, onSave, onTimeChange }: EditEventProps) {
  const [altEvent, setEvent] = useState<Event>(event ? event : { ...emptyEvent, startTime: initialStartTime || emptyEvent.startTime })
  const [editingLocation, setEditingLocation] = useState(false)
  const [saving, setSaving] = useState(false)
  const [travelers, setTravelers] = useState<string[]>(() => {
    if (!event?.travelers || !members?.length) return []
    const names = event.travelers.split(', ').filter(Boolean)
    return members.filter(m => names.includes(m.name)).map(m => m.id)
  })

  altEvent.dayid = day
  altEvent.itineraryid = trip

  useEffect(() => {
    onTimeChange?.(altEvent.startTime, altEvent.duration)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [altEvent.startTime, altEvent.duration])

  const handleChange = (field: string, value: any) => {
    setEvent(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    if (!altEvent.title.trim()) return

    const res = await fetch("/api/auth/event", {
      method: event ? "PUT" : "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: event?.id, itineraryid: trip, day: date,
        title: altEvent.title.trim(), description: altEvent.description.trim(),
        status: altEvent.status, startTime: altEvent.startTime,
        duration: altEvent.duration, location: altEvent.location,
        type: altEvent.type, travelers, lat: altEvent.lat, lng: altEvent.lng
      })
    })

    const data = await res.json()
    if (!res.ok) { console.error(data.error); return }

    const eventId = event ? event.id : data.event.id
    const travelerNames = (members ?? []).filter(m => travelers.includes(m.id)).map(m => m.name).join(', ')
    altEvent.id = eventId
    altEvent.travelers = travelerNames
    onSave(altEvent)
    setSaving(false)
    onClose()
  }

  return (
    <div
      className={`w-full relative flex gap-3 ${cardColor.bg} rounded-xl p-4 sm:p-6`}
      style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)" }}
    >
      {/* Left accent bar */}
      <div className={`w-1 rounded-full ${cardColor.bar} flex-shrink-0`} />

      <div className="flex-1 min-w-0 space-y-4">

        {/* Title */}
        <input
          type="text"
          value={altEvent.title}
          onChange={e => handleChange("title", e.target.value)}
          placeholder="Add Title *"
          className={`w-full font-medium text-base ${cardColor.text} focus:outline-none focus:border-b focus:border-[#ffbd2e] transition-colors bg-transparent`}
          style={{ fontFamily: "Helvetica, serif" }}
        />

        {/* Status row */}
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarCheck size={15} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {STATUS_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => handleChange("status", c.value as EventStatus)}
                className={`h-7 px-3 rounded-full ${c.bg} shadow-sm transition-all duration-200 text-white text-xs font-medium cursor-pointer
                  ${altEvent.status === c.value ? "ring-2 ring-offset-2 ring-gray-700 scale-105" : "hover:scale-105 opacity-80 hover:opacity-100"}`}
              >
                {c.value}
              </button>
            ))}
          </div>
        </div>

        {/* Type row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={15} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {EVENT_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => handleChange("type", c.value)}
                className={`h-7 px-3 rounded-sm ${c.bg} shadow-sm transition-all duration-200 text-xs font-medium cursor-pointer
                  ${altEvent.type === c.value ? `ring-2 ring-offset-2 ${c.ring} scale-105` : "hover:scale-105"}`}
              >
                <span className={c.text}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <textarea
          value={altEvent.description}
          onChange={e => handleChange("description", e.target.value)}
          placeholder="Add details..."
          rows={3}
          style={{ fontFamily: "Georgia, serif" }}
          className={`w-full bg-white border border-[#e3e3e3] rounded-lg px-3.5 py-2.5 ${cardColor.time} placeholder-[#b0a48a] text-xs opacity-80 focus:outline-none focus:border-[#8a7d5a] transition-colors resize-none`}
        />

        {/* Time & Duration — stack on mobile, row on sm+ */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[#1a1812] text-xs uppercase font-medium mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              value={altEvent.startTime}
              onChange={e => handleChange("startTime", e.target.value)}
              className={`w-full bg-white border border-[#e3e3e3] ${cardColor.time} rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#e3e3e3] transition-colors cursor-pointer`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[#1a1812] text-xs uppercase font-medium mb-1.5">
              Duration
            </label>
            <select
              value={altEvent.duration}
              onChange={e => handleChange("duration", Number(e.target.value))}
              className={`w-full bg-white border border-[#e3e3e3] rounded-lg px-3 py-2 ${cardColor.time} text-xs focus:outline-none focus:border-[#8a7d5a] transition-colors cursor-pointer`}
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

        {/* Location */}
        <div className="flex items-center gap-3">
          <MapPin size={15} className="text-gray-400 flex-shrink-0" />
          {editingLocation ? (
            <LocationSearch
              value={altEvent.location}
              onChange={val => handleChange("location", val)}
              onClose={(val, coords) => {
                setEditingLocation(false)
                handleChange("location", val)
                if (coords) {
                  setEvent(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }))
                }
              }}
            />
          ) : (
            <span
              className="cursor-pointer opacity-80 text-sm hover:opacity-100 hover:text-black transition-opacity"
              onClick={() => setEditingLocation(true)}
            >
              {altEvent.location || "Add location"}
            </span>
          )}
        </div>

        {/* Travelers */}
        <div className="flex items-start gap-3">
          <Users size={15} className="text-gray-400 flex-shrink-0 mt-1" />
          <div className="flex flex-col gap-2 w-full min-w-0">
            {(members ?? []).length === 0 && (
              <span className="text-sm text-[#b0a48a]">No members on this trip yet.</span>
            )}
            {(members ?? []).length > 0 && travelers.length === 0 && (
              <span className="text-sm text-[#b0a48a]">@traveler...</span>
            )}
            <div className="flex flex-wrap gap-2">
              {(members ?? []).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTravelers(prev =>
                    prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                  )}
                  className={`px-3 py-1 rounded-full text-sm border transition-all cursor-pointer ${
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

        {/* Cancel & Save */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 border border-[#e3e3e3] text-[#8a7d5a] rounded-lg py-2.5 text-sm tracking-wide hover:bg-[#f5f3f0] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!altEvent.title.trim() || saving}
            className="flex-1 bg-[#fac643] text-white rounded-lg py-2.5 text-sm tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save"}
          </button>
        </div>

      </div>
    </div>
  )
}