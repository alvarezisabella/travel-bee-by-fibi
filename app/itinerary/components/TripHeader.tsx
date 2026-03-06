"use client"

// import Image from "next/image"
import { MapPin, Calendar, Users } from "lucide-react"
import { Trip } from "../types/trips"
import { useState } from "react"

interface Props {
  trip: Trip
}

export default function TripHeader({ trip }: Props) {

  const [title, setTitle] = useState(trip.title)
  const [editing, setEditing] = useState(false)

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-lg bg-white">

      {/* HERO IMAGE */}
      <div className="relative w-full h-[280px]">
        {/* <Image
          src={trip.coverImage}
          alt={trip.title}
          fill
          className="object-cover"
        /> */}
        <h1>image placeholder</h1>
      </div>

      {/* CONTENT */}
      <div className="p-6 flex justify-between items-start">

        <div>

          {/* Editable Title */}
          {editing ? (
            <input
              className="text-2xl font-bold border rounded px-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

            <div className="flex items-center gap-1">
              <MapPin size={16}/>
              {trip.location || "Add location"}
            </div>

            <div className="flex items-center gap-1">
              <Calendar size={16}/>
              {trip.startDate
                ? `${trip.startDate} - ${trip.endDate}`
                : "Add dates"}
            </div>

            <div className="flex items-center gap-1">
              <Users size={16}/>
              {trip.travelers.length} traveler(s)
            </div>

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