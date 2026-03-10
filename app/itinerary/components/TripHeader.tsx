"use client"

// import Image from "next/image"
import {
  MapPin, Calendar, Users, List, CalendarDays, Map, Bookmark
} from "lucide-react"
import { Trip } from "../types/trips"
import { useState, useRef, useEffect } from "react"

interface Props {
  trip: Trip
}

export default function TripHeader({ trip }: Props) {

  const [title, setTitle] = useState(trip.title)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.select()
    }
  }, [editing])

  const [location, setLocation] = useState(trip.location || "")
  const [editingLocation, setEditingLocation] = useState(false)

  const [startDate, setStartDate] = useState(trip.startDate || "")
  const [endDate, setEndDate] = useState(trip.endDate || "")
  const [editingDates, setEditingDates] = useState(false)

  const [coverImage, setCoverImage] = useState<string | null>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverImage(url)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-lg bg-white">

      {/* HERO IMAGE */}
      <div className="relative w-full h-[280px]">
        {coverImage ? (
          <>
            <img src={coverImage} alt="Trip cover" className="w-full h-full object-cover" />
            <label className="absolute bottom-3 right-3 cursor-pointer bg-white bg-opacity-80 text-gray-700 text-xs px-3 py-1.5 rounded-full shadow hover:bg-opacity-100 transition-all">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500 text-sm cursor-pointer hover:text-gray-700 transition-colors">
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white text-xl">
              +
            </div>
            <span>Upload cover photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-6 flex justify-between items-start">

        <div>

          {/* Editable Title */}
          {editing ? (
            <input
              ref={inputRef}
              className="text-2xl font-bold border border-yellow-400 rounded px-2 outline-none focus:ring-2 focus:ring-yellow-300"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.currentTarget.blur(); setEditing(false) }
                if (e.key === "Escape") { setEditing(false) }
              }}
              onBlur={() => setEditing(false)}
            />
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer"
              onClick={() => setEditing(true)}
            >
              {title}
            </h1>
          )}

          {/* Trip Info */}
          <div className="flex gap-6 mt-3 text-gray-500 text-sm">

            {/* LOCATION */}
            <div className="flex items-center gap-1">
              <MapPin size={16}/>

              {editingLocation ? (
                <input
                  className="border rounded px-1 text-sm"
                  value={location}
                  autoFocus
                  onChange={(e) => setLocation(e.target.value)}
                  onBlur={() => setEditingLocation(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingLocation(false)
                  }}
                />
              ) : (
                <span
                  className="cursor-pointer hover:text-black"
                  onClick={() => setEditingLocation(true)}
                >
                  {location || "Add location"}
                </span>
              )}

            </div>

            {/* DATES */}
            <div className="flex items-center gap-1">
              <Calendar size={16}/>

              {editingDates ? (
                <div className="flex gap-1">
                  <input
                    type="date"
                    className="border rounded px-1 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="date"
                    className="border rounded px-1 text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onBlur={() => setEditingDates(false)}
                  />
                </div>
              ) : (
                <span
                  className="cursor-pointer hover:text-black"
                  onClick={() => setEditingDates(true)}
                >
                  {startDate
                    ? `${startDate} - ${endDate}`
                    : "Add dates"}
                </span>
              )}

            </div>

            {/* TRAVELERS */}
            <div className="flex items-center gap-1">
              <Users size={16}/>
              {trip.travelers.length} traveler(s)
            </div>

          </div>

          {/* Bottom Icons */}
          <div className="flex gap-5 mt-5 text-gray-600">
            <List size={20} />
            <CalendarDays size={20} />
            <Map size={20} />
            <Bookmark size={20} />
          </div>

        </div>

        {/* Buttons */}
        <div className="flex gap-3">

          <button className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-full text-sm font-medium">
            Invite Friends
          </button>

          <button className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-full text-sm font-medium">
            + Add Event
          </button>

        </div>

      </div>
    </div>
  )
}