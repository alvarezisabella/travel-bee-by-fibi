"use client"

import {
  MapPin, Calendar, Users, List, CalendarDays, Map, Bookmark,
  X, Copy, Check, Loader2, UserPlus
} from "lucide-react"
import { Trip, Widget } from "../types/types"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import LocationSearch from "./LocationSearch"
import { createClient } from "@/lib/supabase/client"
import { downloadICS } from "@/lib/ics"
import { BookmarkCard } from "./BookmarkCard"
import TripList from "./TripCard"
import CaliforniaMap from "@/app/map/map_view"

interface Props {
  trip: Trip
}

type InviteTab = "link" | "email" | "travelers"

export default function TripHeader({ trip }: Props) {
  const [list, setList] = useState(true)
  const [map, setMap] = useState(false)
  const router = useRouter()
  const [title, setTitle] = useState(trip.title)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  useEffect(() => {
  setLoadingBookmarks(true)
  fetch(`/api/auth/widgets?itinerary_id=${trip.id}`)
    .then(res => res.json())
    .then(data => setSavedIdeas(data))
    .catch(err => console.error("Failed to fetch bookmarks:", err))
    .finally(() => setLoadingBookmarks(false))
}, [])

  async function handleDeleteWidget(ideaId: string) {
    await fetch(`/api/auth/widgets?id=${ideaId}`, { method: 'DELETE' })
    setSavedIdeas(prev => prev.filter(i => i.id !== ideaId))
  }

  const [location, setLocation] = useState(trip.location || "")
  const [editingLocation, setEditingLocation] = useState(false)

  const [startDate, setStartDate] = useState(trip.startDate || "")
  const [endDate, setEndDate] = useState(trip.endDate || "")
  const [editingDates, setEditingDates] = useState(false)
  const [dateError, setDateError] = useState<string | null>(null)
  const [startForwardConflict, setStartForwardConflict] = useState<{ newStart: string; suggestedEnd: string } | null>(null)

  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [bookmarkPanel, setBookmarkPanel] = useState(false)
  const [savedIdeas, setSavedIdeas] = useState<Widget[]>([])

  const saveItinerary = async (fields: { title?: string; location?: string; start_date?: string; end_date?: string; cover_photo_url?: string | null; confirm_date_shift?: boolean }) => {
    setDateError(null)
    const res = await fetch('/api/auth/itinerary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: trip.id, ...fields }),
    })
    if (!res.ok) {
      const data = await res.json()
      if (data.code === 'START_FORWARD') {
        setStartForwardConflict({ newStart: fields.start_date!, suggestedEnd: data.suggested_end })
        setStartDate(trip.startDate || "")
        return
      }
      if (data.code === 'EVENTS_ON_CUT_DAYS') {
        setDateError("Can't shorten the trip — some days being removed still have events.")
        setEndDate(trip.endDate || "")
        return
      }
      return
    }
    if (fields.start_date !== undefined || fields.end_date !== undefined) {
      window.location.reload()
    } else {
      router.refresh()
    }
  }

  const handleConfirmStartForward = async () => {
    if (!startForwardConflict) return
    setStartForwardConflict(null)
    await saveItinerary({
      start_date: startForwardConflict.newStart,
      end_date: startForwardConflict.suggestedEnd,
      confirm_date_shift: true,
    })
  }

  const [coverImage, setCoverImage] = useState<string | null>(trip.cover_photo_url || null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

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
        body: JSON.stringify({ id: trip.id, cover_photo_url: bustUrl }),
      })

      if (!res.ok) throw new Error('Failed to save cover photo')

      setCoverImage(bustUrl)

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
      await fetch('/api/auth/event/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary_id: trip.id }),
      })

      await fetch('/api/auth/itinerary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: trip.id,
          title: 'New Trip',
          location: null,
          start_date: null,
          end_date: null,
          cover_photo_url: null,
        }),
      })

      setShowClearModal(false)
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

  return (
    <div>
    <div className="w-full mx-auto rounded-2xl shadow-lg bg-white">

      {/* HERO IMAGE */}
      <div className="relative w-full h-[280px]">
        {coverImage ? (
          <>
            <img src={coverImage} alt="Trip cover" className="w-full h-full object-cover rounded-t-2xl" />
            <label className={`absolute bottom-3 right-3 cursor-pointer bg-white bg-opacity-80 text-gray-700 text-xs px-3 py-1.5 rounded-full shadow hover:bg-opacity-100 transition-all flex items-center gap-1.5 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              {uploading ? <><Loader2 size={12} className="animate-spin" /> Uploading...</> : "Change photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </>
        ) : (
          <label className={`w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500 text-sm cursor-pointer hover:text-gray-700 transition-colors rounded-t-2xl ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
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

          <div className="flex gap-6 mt-3 text-gray-500 text-sm">
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                {editingDates ? (
                  <div className="flex gap-1">
                    <input
                      type="date"
                      className="border rounded px-1 text-sm"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setDateError(null) }}
                    />
                    <input
                      type="date"
                      className="border rounded px-1 text-sm"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setDateError(null) }}
                      onBlur={() => { setEditingDates(false); saveItinerary({ start_date: startDate, end_date: endDate }) }}
                    />
                  </div>
                ) : (
                  <span className="cursor-pointer hover:text-black" onClick={() => setEditingDates(true)}>
                    {startDate ? `${startDate} – ${endDate}` : "Add dates"}
                  </span>
                )}
              </div>
              {dateError && (
                <p className="text-xs text-red-500 ml-5">{dateError}</p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Users size={16} />
              {trip.travelers.length} traveler(s)
            </div>
          </div>

          {/* Bottom Icons */}
          <div className="flex gap-5 mt-5 text-gray-600">
            <button
              onClick={() => {setMap(false);setList(true)}}
              className="hover:text-black transition cursor-pointer"
            >
              <List size={20} />
            </button>
            <CalendarDays size={20} />
            <button
            className="cursor-pointer"
            onClick={() => {setList(false);setMap(true);}}
            >  
            <Map size={20} />
            </button>
            <button
              onClick={() => setBookmarkPanel(true)}
              className="hover:text-black transition relative cursor-pointer"
            >
              <Bookmark size={20} />
            </button>
          </div>

        </div>

      {/* BOOKMARKS SIDE PANEL */}
      {bookmarkPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setBookmarkPanel(false)}
          />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bookmark size={18} className="text-gray-700" />
                <h2 className="text-base font-semibold text-gray-900">Saved ideas</h2>
              </div>
              <button
                onClick={() => setBookmarkPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ideas list */}
            <div className="flex-1 p-4 flex flex-col gap-3">
              {loadingBookmarks ? (
                <div className="flex items-center justify-center mt-8">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              ) : savedIdeas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">No saved ideas yet.</p>
              ) : (
                savedIdeas.map((idea) => (
              <BookmarkCard
                key={idea.id}
                idea={idea}
                tripId={trip.id}
                days={trip.days}
                onAdded={() => {
                  setBookmarkPanel(false)
                  router.refresh()
                }}
                onDelete={() => handleDeleteWidget(idea.id)}
              />
                ))
              )}
            </div>

          </div>
        </div>
      )}
        
        
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
                This will remove all events, dates, location, and the cover photo. This cannot be undone.
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

      {/* START FORWARD CONFIRMATION MODAL */}
      {startForwardConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 mx-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-gray-900">Adjust trip dates?</h2>
              <p className="text-sm text-gray-500">
                Moving the start date forward will shift all events to maintain their relative position.
                The end date will be adjusted to <span className="font-medium text-gray-700">{startForwardConflict.suggestedEnd}</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setStartForwardConflict(null); setStartDate(trip.startDate || "") }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartForward}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-all"
              >
                Adjust end date
              </button>
            </div>
          </div>
        </div>
      )}

  </div>
      {list && (
        <TripList trip = {trip}/>
      )}
      {map && (
        <CaliforniaMap events={trip.days.flatMap(Day => Day.events)}/>
      )}
    </div>
  );
}