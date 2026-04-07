"use client"

import {
  MapPin, Calendar, Users, List, CalendarDays, Map, Bookmark,
  X, Copy, Check, Loader2, UserPlus
} from "lucide-react"
import { Trip } from "../types/types"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import LocationSearch from "./LocationSearch"
import { createClient } from "@/lib/supabase/client"
import { downloadICS } from "@/lib/ics"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookmarkCard } from "./BookmarkCard"


interface Props {
  trip: Trip
}

type InviteTab = "link" | "email" | "travelers"

export default function TripHeader({ trip }: Props) {

  const router = useRouter()

  const [title, setTitle] = useState(trip.title)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const [location, setLocation] = useState(trip.location || "")
  const [editingLocation, setEditingLocation] = useState(false)

  const [startDate, setStartDate] = useState(trip.startDate || "")
  const [endDate, setEndDate] = useState(trip.endDate || "")
  const [editingDates, setEditingDates] = useState(false)

  const saveItinerary = async (fields: {
    title?: string
    location?: string
    start_date?: string
    end_date?: string
    cover_photo_url?: string | null
    cover_photo_position?: number | null
  }) => {
    await fetch('/api/auth/itinerary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: trip.id, ...fields }),
    })
    if (fields.start_date || fields.end_date) {
      window.scrollTo(0,0)
      window.location.reload()
    } else {
      router.refresh()
    }
  }

  // Cover photo state
  const [coverImage, setCoverImage] = useState<string | null>(trip.cover_photo_url || null)
  const [coverPosition, setCoverPosition] = useState<number>(trip.cover_photo_position ?? 50)
  const [isRepositioning, setIsRepositioning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartPos, setDragStartPos] = useState(50)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStartY(e.clientY)
    setDragStartPos(coverPosition)
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const heroHeight = heroRef.current?.clientHeight ?? 280
    const delta = e.clientY - dragStartY
    const newPos = Math.min(100, Math.max(0, dragStartPos - (delta / heroHeight) * 100))
    setCoverPosition(newPos)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
  }

  const handleSavePosition = async () => {
    setIsRepositioning(false)
    const supabase = createClient()
    await supabase
      .from('itineraries')
      .update({ cover_photo_position: coverPosition })
      .eq('id', trip.id)
  }

  const handleCancelReposition = () => {
    setIsRepositioning(false)
    setCoverPosition(trip.cover_photo_position ?? 50)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ""
    setUploading(true)
    setUploadError(null)

    try {
      const supabase = createClient()

      const filePath = `${trip.id}/cover`
      const { error: uploadErr } = await supabase.storage
        .from("itinerary-covers")
        .upload(filePath, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from("itinerary-covers")
        .getPublicUrl(filePath)

      const bustUrl = `${publicUrl}?t=${Date.now()}`

      const res = await fetch('/api/auth/itinerary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trip.id, cover_photo_url: bustUrl, cover_photo_position: 50 }),
      })

      if (!res.ok) throw new Error('Failed to save cover photo')

      setCoverImage(bustUrl)
      setCoverPosition(50)

    } catch (err) {
      console.error("Upload failed:", err)
      setUploadError("Failed to upload photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  // Clear itinerary
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)

  const handleClearItinerary = async () => {
    setClearing(true)
    try {
      const supabase = createClient()

      await supabase.from('events').delete().eq('itinerary_id', trip.id)

      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('itinerary_id', trip.id)

      const sessionIds = sessions?.map((s) => s.id) ?? []

      if (sessionIds.length > 0) {
        await supabase.from('chat_messages').delete().in('session_id', sessionIds)
      }

      await supabase.from('chat_sessions').delete().eq('itinerary_id', trip.id)

      await supabase
        .from('itineraries')
        .update({
          title: 'New Trip',
          location: null,
          start_date: null,
          end_date: null,
          cover_photo_url: null,
          cover_photo_position: 50,
        })
        .eq('id', trip.id)

      setShowClearModal(false)
      window.scrollTo(0, 0)
      window.location.reload()
    } catch (err) {
      console.error("Failed to clear itinerary:", err)
    } finally {
      setClearing(false)
    }
  }

  /* Invite */
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteTab, setInviteTab] = useState<InviteTab>("link")
  const [emailInput, setEmailInput] = useState("")
  const [sentInvites, setSentInvites] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [travelers, setTravelers] = useState(trip.travelers)

  const shareLink = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?tripId=${trip.id}`

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          tripId: trip.id,
          inviterId: trip.travelers.find(t => t.role === "owner")?.id,
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

  const pathname = usePathname()

  const [bookmarkModal, setBookmarkModal] = useState(false)

  const widgets = [
    {
      id: "1",
      title: "Try local coffee shop",
      description: "Find a cute coffee spot nearby",
      type: "Activity",
    },
    {
      id: "2",
      title: "Visit museum",
      description: "Explore art and culture",
      type: "Activity",
    },
    {
      id: "3",
      title: "Sunset beach walk",
      description: "Relax by the ocean",
      type: "Activity",
    }
  ]

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl shadow-lg bg-white">

      {/* HERO IMAGE */}
      <div
        ref={heroRef}
        className={`group relative w-full h-[280px] overflow-hidden rounded-t-2xl ${isRepositioning && !isDragging ? "cursor-grab" : ""} ${isDragging ? "cursor-grabbing" : ""}`}
        onMouseDown={isRepositioning ? handleDragStart : undefined}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {coverImage ? (
          <>
            <img
              src={coverImage}
              alt="Trip cover"
              className="w-full h-full object-cover select-none"
              style={{ objectPosition: `center ${coverPosition}%` }}
              draggable={false}
            />

            {/* Reposition overlay */}
            {isRepositioning && (
              <div className="absolute inset-0 bg-black/20 pointer-events-none flex items-center justify-center">
                <div className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
                  ↕ Drag anywhere to reposition
                </div>
              </div>
            )}

            {/* Controls */}
            <div
              className={`absolute bottom-3 right-3 flex gap-2 transition-opacity duration-200 ${isRepositioning ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {isRepositioning ? (
                <>
                  <button
                    onClick={handleCancelReposition}
                    className="bg-white/90 text-gray-600 text-xs px-3 py-1.5 rounded-full shadow hover:bg-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePosition}
                    className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow hover:bg-gray-700 transition-all"
                  >
                    Save position
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsRepositioning(true)}
                    className="bg-white/80 hover:bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full shadow transition-all"
                  >
                    ↕ Reposition
                  </button>
                  <label className={`cursor-pointer bg-white/80 hover:bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full shadow transition-all flex items-center gap-1.5 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploading ? <><Loader2 size={12} className="animate-spin" /> Uploading...</> : "Change photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                </>
              )}
            </div>
          </>
        ) : (
          <label className={`w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500 text-sm cursor-pointer hover:text-gray-700 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading ? (
              <><Loader2 size={24} className="animate-spin text-gray-400" /><span>Uploading...</span></>
            ) : (
              <><div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white text-xl">+</div><span>Upload cover photo</span></>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        )}
        {uploadError && (
          <div className="absolute bottom-3 left-3 bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-full">
            {uploadError}
          </div>
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
              onBlur={() => { setEditing(false); saveItinerary({ title }) }}
            />
          ) : (
            <h1 className="text-2xl font-bold cursor-pointer" onClick={() => setEditing(true)}>
              {title}
            </h1>
          )}

          {/* Trip Info */}
          <div className="flex gap-6 mt-3 text-gray-500 text-sm">

            {/* LOCATION */}
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              {editingLocation ? (
                <LocationSearch
                  value={location}
                  onChange={(val) => setLocation(val)}
                  onClose={(val) => { setEditingLocation(false); saveItinerary({ location: val }) }}
                />
              ) : (
                <span className="cursor-pointer hover:text-black" onClick={() => setEditingLocation(true)}>
                  {location || "Add location"}
                </span>
              )}
            </div>

            {/* DATES */}
            <div className="flex items-center gap-1">
              <Calendar size={16} />
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
                    onBlur={() => { setEditingDates(false); saveItinerary({ start_date: startDate, end_date: endDate }) }}
                  />
                </div>
              ) : (
                <span className="cursor-pointer hover:text-black" onClick={() => setEditingDates(true)}>
                  {startDate ? `${startDate} – ${endDate}` : "Add dates"}
                </span>
              )}
            </div>

            {/* TRAVELERS */}
            <div className="flex items-center gap-1">
              <Users size={16} />
              {trip.travelers.length} traveler(s)
            </div>

          </div>

          {/* Bottom Icons */}
          <div className="flex gap-5 mt-5">
            <Link
              href={`/itinerary/${trip.id}`}
              className={`p-2 rounded-lg transition-all ${
                pathname === `/itinerary/${trip.id}`
                  ? "text-yellow-500 bg-yellow-50"
                  : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
              }`}
            >
              <List size={20} />
            </Link>

            <Link
              href={`/itinerary/${trip.id}/calendar`}
              className={`p-2 rounded-lg transition-all ${
                pathname === `/itinerary/${trip.id}/calendar`
                  ? "text-yellow-500 bg-yellow-50"
                  : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
              }`}
            >
              <CalendarDays size={20} />
            </Link>

            <Link
              href={`/map?tripId=${trip.id}`}
              className={`p-2 rounded-lg transition-all ${
                pathname.startsWith(`/map`)
                  ? "text-yellow-500 bg-yellow-50"
                  : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
              }`}
            >
              <Map size={20} />
            </Link>

            <button
              type="button"
              onClick={() => setBookmarkModal(true)}
              className="p-2 rounded-lg transition-all text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
            >
              <Bookmark size={20} />
            </button>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-3">
            <button
              onClick={() => { setInviteModal(true); setInviteTab("link") }}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-300 to-yellow-500 hover:from-yellow-400 hover:to-yellow-600 border border-yellow-400 hover:border-yellow-500 px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-all"
            >
              <UserPlus size={16} /> Invite Friends
            </button>
            <button
              onClick={() => downloadICS(trip)}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-300 to-yellow-500 hover:from-yellow-400 hover:to-yellow-600 border border-yellow-400 hover:border-yellow-500 px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-all"
            >
              <Calendar size={16} /> Save to Calendar
            </button>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-full transition-all"
          >
            Clear Itinerary
          </button>
        </div>
      </div>

      {/* BOOKMARK MODAL */}
      {bookmarkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBookmarkModal(false)
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4 mx-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Bookmarks</h2>
              <button
                onClick={() => setBookmarkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Your bookmarked places and ideas will show here.
            </p>

            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              {widgets.map((idea) => (
                <BookmarkCard
                  key={idea.id}
                  idea={idea as any}
                  tripId={trip.id}
                  days={[]} // you can connect real days later
                  onAdded={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>

            <button
              onClick={() => setBookmarkModal(false)}
              className="self-end px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-sm font-medium text-gray-900 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

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

            <div className="flex border-b border-gray-200">
              {(["link", "email", "travelers"] as InviteTab[]).map((tab) => (
                <button key={tab} onClick={() => setInviteTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-all ${
                    inviteTab === tab ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}>
                  {tab === "link" ? "Share Link" : tab === "email" ? "Send Invite" : "Travelers"}
                </button>
              ))}
            </div>

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
                      {t.role !== "owner" && (
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

      {/* CLEAR CONFIRMATION MODAL */}
      {showClearModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setShowClearModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 mx-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-gray-900">Clear itinerary?</h2>
              <p className="text-sm text-gray-500">
                This will remove all events, dates, location, the cover photo, and the chat history. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleClearItinerary}
                disabled={clearing}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {clearing ? <><Loader2 size={14} className="animate-spin" /> Clearing...</> : "Yes, clear it"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}