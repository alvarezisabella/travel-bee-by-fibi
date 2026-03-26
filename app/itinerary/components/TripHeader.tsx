"use client"

// import Image from "next/image"
import {
  MapPin, Calendar, Users, List, CalendarDays, Map, Bookmark,
  X, Copy, Check
} from "lucide-react"
import { Trip } from "../types/trips"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import LocationSearch from "./LocationSearch"
// import { navigate } from "next/dist/client/components/segment-cache/navigation"
import { useRouter } from "next/navigation"


interface Props {
  trip: Trip
}

type InviteTab = "link" | "email" | "travelers"

export default function TripHeader({ trip }: Props) {
  const router = useRouter();

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

  /* Invite */
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteTab, setInviteTab] = useState<InviteTab>("link")
  const [emailInput, setEmailInput] = useState("")
  const [sentInvites, setSentInvites] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [travelers, setTravelers] = useState(trip.travelers)

  const shareLink = "https://travelbee.com/trip/hawaii-summer-26?invite=abc123"

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendInvite = async () => {
    if (!emailInput) return

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput,
          tripId: trip.id,
          inviterName: trip.travelers.find(t => t.role === "owner")?.name || "A friend",
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setSentInvites((prev) => [...prev, emailInput])
      setEmailInput("")
    } catch (err) {
      console.error(err)
      alert("Failed to send invite")
    }
  }

  const handleRemoveTraveler = (id: string) => setTravelers((prev) => prev.filter((t) => t.id !== id))

  


  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl shadow-lg bg-white">

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
                <LocationSearch
                  value={location}
                  onChange={(val) => setLocation(val)}
                  onClose={() => setEditingLocation(false)}
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
            <div
              className="flex items-center gap-1"
              //onClick={() => { setInviteModal(true); setInviteTab("travelers") }}
            >
              <Users size={16}/>
              {trip.travelers.length} traveler(s)
            </div>

          </div>

          {/* Bottom Icons */}
          <div className="flex gap-5 mt-5 text-gray-600">
            <button
              onClick={() => router.push(`/itinerary/${trip.id}`)}
              className="hover:text-black transition"
            >
              <List size={20} />
            </button>

            <button
              onClick={() => router.push(`/itinerary/${trip.id}/calendar`)}
              className="hover:text-black transition"
            >
              <CalendarDays size={20} />
            </button>
            <button
              onClick={() => router.push(`/itinerary/${trip.id}/map`)}
              className="hover:text-black transition"
            >
              <Map size={20} />
            </button>
            <button
              onClick={() => router.push(`/itinerary/${trip.id}/bookmarks`)}
              className="hover:text-black transition"
            >
              <Bookmark size={20} />
            </button>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex gap-3">

          <button
            onClick={() => { setInviteModal(true); setInviteTab("link") }}
            className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-full text-sm font-medium"
          >
            Invite Friends
          </button>

        </div>
      </div>
      {/* INVITE MODAL */}
        {inviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setInviteModal(false) }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Invite Friends</h2>
                <button onClick={() => setInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {(["link", "email", "travelers"] as InviteTab[]).map((tab) => (
                  <button key={tab} onClick={() => setInviteTab(tab)}
                    className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-all ${
                      inviteTab === tab
                        ? "border-yellow-400 text-gray-900"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}>
                    {tab === "link" ? "Share Link" : tab === "email" ? "Send Invite" : "Travelers"}
                  </button>
                ))}
              </div>

              {/* Share Link */}
              {inviteTab === "link" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-500">Share this link to invite friends to your trip:</p>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                    <span className="flex-1 text-sm text-gray-600 truncate">{shareLink}</span>
                    <button onClick={handleCopyLink}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        copied ? "bg-green-100 text-green-700" : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                      }`}>
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Anyone with this link can request to join your trip.</p>
                </div>
              )}

              {/* Send Invite */}
              {inviteTab === "email" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-500">Enter an email address to send an invitation:</p>
                  <div className="flex gap-2">
                    <input type="email" placeholder="friend@example.com" value={emailInput} autoFocus
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSendInvite() }}
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all" />
                    <button onClick={handleSendInvite} className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-xl text-sm font-medium">
                      Send
                    </button>
                  </div>
                  {sentInvites.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent invites</span>
                      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                        {sentInvites.map((email) => (
                          <div key={email} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">{email}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Invited</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Travelers */}
              {inviteTab === "travelers" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-500">People currently on this trip:</p>
                  <div className="flex flex-col gap-2">
                    {travelers.map((t) => (
                      <div key={t.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-sm font-semibold text-yellow-800">
                          {t.name.charAt(0)}
                        </div>
                        <span className="flex-1 text-sm text-gray-800">
                          {t.name}
                          {t.role && <span className="ml-2 text-xs text-gray-400 capitalize">{t.role}</span>}
                        </span>
                        {t.role !== 'owner' && (
                          <button onClick={() => handleRemoveTraveler(t.id)} className="text-gray-300 hover:text-red-400 hover:bg-red-50 p-1 rounded transition-all">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {travelers.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No travelers yet.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
    </div>
  )
}