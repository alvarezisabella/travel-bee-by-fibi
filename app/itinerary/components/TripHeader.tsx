"use client"

import {
  MapPin, Calendar, Users, List, CalendarDays, Map, Bookmark,
  X, Copy, Check, Loader2, UserPlus
} from "lucide-react"
import { Trip } from "../types/types"
import { useState, useRef, useEffect } from "react"
import LocationSearch from "./LocationSearch"
import { createClient } from "@/lib/supabase/client"
import { downloadICS } from "@/lib/ics"

interface Props {
  trip: Trip
}

type InviteTab = "link" | "email" | "travelers"

export default function TripHeader({ trip }: Props) {

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

  const saveItinerary = async (fields: { title?: string; location?: string; start_date?: string; end_date?: string }) => {
    await fetch('/api/auth/itinerary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: trip.id, ...fields }),
    })
  }

  const [coverImage, setCoverImage] = useState<string | null>(trip.cover_photo_url || null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input value so the same file can be re-selected if needed
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

      // Cache-bust so the browser loads the new image instead of the cached one
      const bustUrl = `${publicUrl}?t=${Date.now()}`

      const res = await fetch('/api/auth/itinerary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trip.id, cover_photo_url: bustUrl }),
      })

      if (!res.ok) throw new Error('Failed to save cover photo')

      setCoverImage(bustUrl) // use busted URL for display only

    } catch (err) {
      console.error("Upload failed:", err)
      setUploadError("Failed to upload photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  /* Invite */
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteTab, setInviteTab] = useState<InviteTab>("link")
  const [emailInput, setEmailInput] = useState("")
  const [sentInvites, setSentInvites] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [travelers, setTravelers] = useState(trip.travelers)

  const shareLink = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?tripId=${trip.id}`;

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
              <>
                <Loader2 size={24} className="animate-spin text-gray-400" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white text-xl">+</div>
                <span>Upload cover photo</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        )}

        {/* Error message */}
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
                  {startDate ? `${startDate} - ${endDate}` : "Add dates"}
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
          <div className="flex gap-5 mt-5 text-gray-600">
            <List size={20} />
            <CalendarDays size={20} />
            <Map size={20} />
            <Bookmark size={20} />
          </div>

        </div>

        {/* Buttons */}
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
                    inviteTab === tab ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
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
    </div>
  )
}