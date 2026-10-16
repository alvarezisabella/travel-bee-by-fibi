"use client"
import {
  MapPin, Calendar, Users, List, CalendarDays, Map as MapIcon, Bookmark, FileText,
  X, Copy, Check, Loader2, UserPlus, MoveLeft, Compass, BedDouble, ChevronRight, Download
} from "lucide-react"
import { Trip, Widget } from "../../types/types"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import LocationSearch from "../../components/LocationSearch"
import { createClient } from "@/lib/supabase/client"
import { downloadICS } from "@/lib/ics"
import { BookmarkCard } from "../../components/BookmarkCard"
import DocumentsPanel from "../../components/DocumentsPanel"
import Link from "next/link"
import ExploreMapPanel from "../explore/components/ExploreMapPanel"

interface Props {
  trip: Trip
}

type InviteTab = "link" | "email" | "travelers"

export function BackButton({ message, route }: { message: string; route: string }) {
  return (
    <Link href={route}>
      <div className="bg-gray-900/30 hover:bg-gray-600/30 hover:cursor-pointer text-white flex px-2 py-1 rounded-md items-align">
        <MoveLeft size={20} /><span className="ps-0.5">{message}</span>
      </div>
    </Link>
  )
}

// ─── Custom date range picker ─────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS_OF_WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"]

function toKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
function fmtDisplay(d: Date) {
  return `${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getDate().toString().padStart(2,"0")}/${d.getFullYear()}`
}
function dateToISO(d: Date) { return d.toISOString().split("T")[0] }
function parseISO(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  date.setHours(0,0,0,0)
  return date
}

interface CalPopupProps {
  viewDate: Date
  startDate: Date | null
  endDate: Date | null
  which: "start" | "end"
  onShift: (dir: number) => void
  onPick: (date: Date) => void
}

function CalPopup({ viewDate, startDate, endDate, which, onShift, onPick }: CalPopupProps) {
  const today = new Date(); today.setHours(0,0,0,0)
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const last  = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0)

  const cells = []
  for (let i = 0; i < first.getDay(); i++) cells.push(<div key={`e-${i}`} />)
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d)
    date.setHours(0,0,0,0)
    const isStart  = startDate && toKey(date) === toKey(startDate)
    const isEnd    = endDate   && toKey(date) === toKey(endDate)
    const inRange  = startDate && endDate && date > startDate && date < endDate
    const isToday  = toKey(date) === toKey(today)
    const disabled = which === "end" ? (startDate ? date < startDate : false) : false

    let cls = "w-8 h-8 flex items-center justify-center text-[13px] relative cursor-pointer select-none "
    if (disabled)              cls += "text-gray-300 cursor-default "
    else if (isStart && isEnd) cls += "bg-[#F5C300] text-[#3d3000] font-medium rounded-lg "
    else if (isStart)          cls += "bg-[#F5C300] text-[#3d3000] font-medium rounded-l-lg "
    else if (isEnd)            cls += "bg-[#FF8C00] text-white font-medium rounded-r-lg "
    else if (inRange)          cls += "bg-yellow-50 text-[#92600a] rounded-none "
    else                       cls += "hover:bg-yellow-50 hover:text-[#92600a] rounded-lg "

    cells.push(
      <div key={d} className={cls} onClick={() => !disabled && onPick(date)}>
        {d}
        {isToday && !isStart && !isEnd && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F5C300]" />
        )}
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-2xl p-4 z-50 shadow-lg w-[272px]">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onShift(-1)} className="w-7 h-7 rounded-lg border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors cursor-pointer">‹</button>
        <span className="text-[14px] font-medium text-gray-900">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
        <button onClick={() => onShift(1)}  className="w-7 h-7 rounded-lg border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors cursor-pointer">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="w-8 h-6 flex items-center justify-center text-[11px] font-medium text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">{cells}</div>
    </div>
  )
}

interface TripDatePickerProps {
  startDate: Date | null
  endDate: Date | null
  onSave: (start: string, end: string) => void
}

function TripDatePicker({ startDate, endDate, onSave }: TripDatePickerProps) {
  const [openCal, setOpenCal]       = useState<"start" | "end" | null>(null)
  const [localStart, setLocalStart] = useState<Date | null>(startDate)
  const [localEnd,   setLocalEnd]   = useState<Date | null>(endDate)
  const [startView,  setStartView]  = useState(startDate ?? new Date())
  const [endView,    setEndView]    = useState(endDate ?? new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpenCal(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function pickStart(d: Date) {
    setLocalStart(d)
    if (localEnd && localEnd <= d) setLocalEnd(null)
    setOpenCal(null)
    if (localEnd && localEnd > d) onSave(dateToISO(d), dateToISO(localEnd))
  }

  function pickEnd(d: Date) {
    setLocalEnd(d)
    setOpenCal(null)
    if (localStart) onSave(dateToISO(localStart), dateToISO(d))
  }

  function openEnd() {
    if (localStart) setEndView(new Date(localStart.getFullYear(), localStart.getMonth(), 1))
    setOpenCal(prev => prev === "end" ? null : "end")
  }

  return (
    <div ref={containerRef} className="flex items-center gap-1 flex-wrap">
      <Calendar size={16} className="text-gray-400 flex-shrink-0" />
      <div className="relative">
        <button onClick={() => setOpenCal(prev => prev === "start" ? null : "start")} className="text-sm text-gray-600 hover:text-black cursor-pointer bg-transparent border-none outline-none">
          {localStart ? fmtDisplay(localStart) : "Add start date"}
        </button>
        {openCal === "start" && (
          <CalPopup viewDate={startView} startDate={localStart} endDate={localEnd} which="start"
            onShift={dir => setStartView(v => new Date(v.getFullYear(), v.getMonth()+dir, 1))}
            onPick={pickStart} />
        )}
      </div>
      {(localStart || localEnd) && <span className="text-gray-400 text-sm mx-0.5">–</span>}
      <div className="relative">
        <button onClick={openEnd} className="text-sm text-gray-600 hover:text-black cursor-pointer bg-transparent border-none outline-none">
          {localEnd ? fmtDisplay(localEnd) : "Add end date"}
        </button>
        {openCal === "end" && (
          <CalPopup viewDate={endView} startDate={localStart} endDate={localEnd} which="end"
            onShift={dir => setEndView(v => new Date(v.getFullYear(), v.getMonth()+dir, 1))}
            onPick={pickEnd} />
        )}
      </div>
    </div>
  )
}

// Hub Tile
// A single destination in the hub. Renders a <Link> when given an href,
// otherwise a <button> (used for actions that open a panel or modal).

interface HubTileProps {
  icon: React.ReactNode
  title: string
  hint: string
  href?: string
  onClick?: () => void
  tone?: "primary" | "default" | "outline"
  className?: string
}

function HubTile({ icon, title, hint, href, onClick, tone = "default", className = "" }: HubTileProps) {
  const tones = {
    primary: "bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-400 text-gray-900",
    default: "bg-white border-gray-200 hover:border-yellow-400 text-gray-900",
    outline: "bg-yellow-50/60 border-yellow-300 hover:bg-yellow-50 text-gray-900",
  }
  const iconTones = {
    primary: "bg-white/70 text-gray-900",
    default: "bg-yellow-100 text-yellow-800",
    outline: "bg-yellow-100 text-yellow-800",
  }
  const base = `group relative flex flex-col justify-between gap-6 rounded-3xl border p-4 sm:p-5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 ${tones[tone]} ${className}`

  const content = (
    <>
      <div className="flex items-start justify-between">
        <span className={`flex items-center justify-center rounded-2xl ${tone === "primary" ? "w-14 h-14" : "w-11 h-11"} ${iconTones[tone]}`}>
          {icon}
        </span>
        <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-700 transition-colors mt-1" />
      </div>
      <div className="min-w-0">
        <div className={`font-semibold ${tone === "primary" ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"}`}>{title}</div>
        <div className={`mt-0.5 text-sm ${tone === "primary" ? "text-gray-800" : "text-gray-500"}`}>{hint}</div>
      </div>
    </>
  )

  if (href) return <Link href={href} className={base}>{content}</Link>
  return <button type="button" onClick={onClick} className={base}>{content}</button>
}

// Main Trip Hub

export default function TripHub({ trip }: Props) {
  const router = useRouter()
  const [title, setTitle]     = useState(trip.title)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  const [location, setLocation]               = useState(trip.location || "")
  const [editingLocation, setEditingLocation] = useState(false)
  const [stay, setStay]                       = useState(trip.stayLocation || "")
  const [editingStay, setEditingStay]         = useState(false)
  const [startDate, setStartDate]             = useState(trip.startDate || "")
  const [endDate, setEndDate]                 = useState(trip.endDate || "")
  const [dateError, setDateError]             = useState<string | null>(null)
  const [startForwardConflict, setStartForwardConflict] = useState<{ newStart: string; suggestedEnd: string } | null>(null)

  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [bookmarkPanel, setBookmarkPanel]       = useState(false)
  const [documentsPanel, setDocumentPanel]      = useState(false)
  const [savedIdeas, setSavedIdeas]             = useState<Widget[]>([])

  const fetchBookmarks = useCallback(async () => {
    setLoadingBookmarks(true)
    try {
      const res = await fetch(`/api/auth/widgets?itinerary_id=${trip.id}`)
      const data = await res.json()
      setSavedIdeas(data)
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err)
    } finally {
      setLoadingBookmarks(false)
    }
  }, [trip.id])

  useEffect(() => { fetchBookmarks() }, [fetchBookmarks])

  useEffect(() => {
    function onWidgetBookmarked() { fetchBookmarks() }
    window.addEventListener('widget-bookmarked', onWidgetBookmarked)
    return () => window.removeEventListener('widget-bookmarked', onWidgetBookmarked)
  }, [fetchBookmarks])

  async function handleDeleteWidget(ideaId: string) {
    await fetch(`/api/auth/widgets?id=${ideaId}`, { method: 'DELETE' })
    setSavedIdeas(prev => prev.filter(i => i.id !== ideaId))
  }

  const saveLocation = async (location: string, coords?: { lat: number; lng: number }) => {
    const res = await fetch('/api/auth/itinerary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: trip.id, location, lat: coords?.lat, lng: coords?.lng }),
    })
    if (!res.ok) console.log(await res.json())
  }

  const saveStay = async (stayLocation: string, coords?: { lat: number; lng: number }) => {
    const trimmed = stayLocation.trim()
    // Clicking away without picking anything new keeps the saved stay and its coords
    if (!coords && trimmed === (trip.stayLocation || "")) return
    const res = await fetch('/api/auth/itinerary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: trip.id,
        stay_location: trimmed || null,
        stay_lat: coords?.lat ?? null,
        stay_lng: coords?.lng ?? null,
      }),
    })
    if (!res.ok) {
      console.log(await res.json())
      return
    }
    router.refresh()
  }

  const saveItinerary = async (fields: {
    title?: string; location?: string; start_date?: string; end_date?: string
    cover_photo_url?: string | null; confirm_date_shift?: boolean
  }) => {
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
    await saveItinerary({ start_date: startForwardConflict.newStart, end_date: startForwardConflict.suggestedEnd, confirm_date_shift: true })
  }

  const [coverImage, setCoverImage]   = useState<string | null>(trip.cover_photo_url || null)
  const [uploading, setUploading]     = useState(false)
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
      const { error: uploadErr } = await supabase.storage.from("itinerary-covers").upload(filePath, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from("itinerary-covers").getPublicUrl(filePath)
      const bustUrl = `${publicUrl}?t=${Date.now()}`
      const res = await fetch('/api/auth/itinerary', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: trip.id, cover_photo_url: bustUrl }) })
      if (!res.ok) throw new Error('Failed to save cover photo')
      setCoverImage(bustUrl)
    } catch (err) {
      console.error("Upload failed:", err)
      setUploadError("Failed to upload photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing]             = useState(false)

  const handleClearItinerary = async () => {
    setClearing(true)
    try {
      await fetch('/api/auth/event/clear', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itinerary_id: trip.id }) })
      await fetch('/api/auth/itinerary', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: trip.id, title: 'New Trip', location: null, lat: null, lng: null, start_date: null, end_date: null, cover_photo_url: null, stay_location: null, stay_lat: null, stay_lng: null, travel_mood: null, num_travelers: null }) })
      setShowClearModal(false)
      window.location.reload()
    } catch (err) {
      console.error("Failed to clear itinerary:", err)
    } finally {
      setClearing(false)
    }
  }

  const [inviteModal, setInviteModal] = useState(false)
  const [inviteTab, setInviteTab]     = useState<InviteTab>("link")
  const [emailInput, setEmailInput]   = useState("")
  const [sentInvites, setSentInvites] = useState<string[]>([])
  const [copied, setCopied]           = useState(false)
  const [travelers, setTravelers]     = useState(trip.travelers)
  const [travelerToRemove, setTravelerToRemove] = useState<{ id: string; name: string } | null>(null)

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
        body: JSON.stringify({ email: emailInput, tripId: trip.id, inviterId: trip.travelers.find(t => t.role === "owner")?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSentInvites(prev => [...prev, emailInput])
      setEmailInput("")
    } catch (err) {
      console.error(err)
      alert("Failed to send invite")
    }
  }

  const handleRemoveTraveler = async (id: string) => {
    const prevTravelers = travelers
    setTravelers(prev => prev.filter(t => t.id !== id))
    try {
      const res = await fetch('/api/auth/itineraryMembers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, itinerary_id: trip.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.refresh()
    } catch (err) {
      console.error(err)
      setTravelers(prevTravelers)
    }
  }

  const confirmRemoveTraveler = () => {
  if (travelerToRemove) {
    handleRemoveTraveler(travelerToRemove.id)
    setTravelerToRemove(null)
  }
}

function createMapUrl(location: string) {
  const searchLocation =
    location.trim() || "Lisbon, Portugal"

  return `https://www.google.com/maps?q=${encodeURIComponent(
    searchLocation,
  )}&z=13&output=embed`
}

  const totalEvents = trip.days.reduce((n, d) => n + (d.events?.length ?? 0), 0)
  const dayCount = trip.days.length
  const base = `/itinerary/${trip.id}`
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">

      {/* HERO: cover photo with the trip name sitting on it */}
      <div className="relative w-full h-[220px] sm:h-[320px] rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400">
        {coverImage && <img src={coverImage} alt="Trip cover" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />

        <label className={`absolute top-3 right-3 cursor-pointer bg-white/85 hover:bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full shadow transition-all flex items-center gap-1.5 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? <><Loader2 size={12} className="animate-spin" /> Uploading...</> : coverImage ? "Change photo" : "Add cover photo"}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
        </label>
        {uploadError && (
          <div className="absolute top-3 left-3 bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded-full">{uploadError}</div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          {editing ? (
            <input
              ref={inputRef}
              className="text-2xl sm:text-4xl font-bold text-gray-900 bg-white/95 border border-yellow-400 rounded-lg px-2 outline-none focus:ring-2 focus:ring-yellow-300 w-full"
              value={title}
              autoFocus
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") { e.currentTarget.blur(); setEditing(false) }
                if (e.key === "Escape") setEditing(false)
              }}
              onBlur={() => { setEditing(false); saveItinerary({ title }) }}
            />
          ) : (
            <h1
              className="text-3xl sm:text-5xl font-bold cursor-pointer truncate drop-shadow-sm"
              title="Click to rename"
              onClick={() => setEditing(true)}
            >
              {title}
            </h1>
          )}
        </div>
      </div>

      {/* TRIP DETAILS: the editable essentials, kept compact */}
      <div className="bg-white border border-gray-200 rounded-3xl px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-sm text-gray-600">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={16} className="text-gray-400 flex-shrink-0" />
          {editingLocation ? (
            <LocationSearch value={location} onChange={val => setLocation(val)} onClose={(val, coords) => { setEditingLocation(false); saveLocation(val, coords) }} />
          ) : (
            <span className="cursor-pointer hover:text-black truncate" onClick={() => setEditingLocation(true)}>
              {location || "Add location"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <BedDouble size={16} className="text-gray-400 flex-shrink-0" />
          {editingStay ? (
            <LocationSearch
              value={stay}
              onChange={val => setStay(val)}
              onClose={(val, coords) => { setEditingStay(false); setStay(val); saveStay(val, coords) }}
              placeholder="Hotel, Airbnb, or address"
            />
          ) : (
            <span className="cursor-pointer hover:text-black truncate" onClick={() => setEditingStay(true)}>
              {stay || "Add stay"}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <TripDatePicker
            startDate={parseISO(startDate)}
            endDate={parseISO(endDate)}
            onSave={(start, end) => { setStartDate(start); setEndDate(end); saveItinerary({ start_date: start, end_date: end }) }}
          />
          {dateError && <p className="text-xs text-red-500 ml-5">{dateError}</p>}
        </div>

        <button
          type="button"
          onClick={() => { setInviteModal(true); setInviteTab("travelers") }}
          className="flex items-center gap-2 text-left hover:text-black cursor-pointer"
        >
          <div className="flex -space-x-2">
            {travelers.slice(0, 4).map(t =>
              t.avatar_url ? (
                <img key={t.id} src={t.avatar_url} alt={t.name} className="w-6 h-6 rounded-full object-cover border-2 border-white" />
              ) : (
                <div key={t.id} className="w-6 h-6 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center text-[11px] font-semibold text-yellow-800">
                  {t.name.charAt(0)}
                </div>
              )
            )}
            {travelers.length === 0 && <Users size={16} className="text-gray-400" />}
          </div>
          <span>{plural(travelers.length, "traveler")}</span>
        </button>
      </div>

      {/* Hub componenets*/}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* Embedded map */}
        <div className="relative col-span-2 lg:row-span-2 min-h-[260px] rounded-3xl border border-gray-200 bg-gray-100 overflow-hidden">
          {trip.location?.trim() ? (
            <iframe
              title={`Map of ${trip.location}`}
              src={createMapUrl(trip.location)}
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingLocation(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              <MapIcon size={24} />
              <span>Add a location to see the map</span>
            </button>
          )}
          <Link
            href={`${base}/map`}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 hover:bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow transition-colors"
          >
            <MapIcon size={14} />
            Open full map
          </Link>
        </div>

        <HubTile
          tone="primary"
          className="col-span-2"
          href={`${base}`}
          icon={<List size={26} />}
          title="Itinerary"
          hint={dayCount === 0 ? "Set your dates to start planning" : `${plural(dayCount, "day")}, ${plural(totalEvents, "event")}`}
        />
        <HubTile
          href={`${base}/calendar`}
          icon={<CalendarDays size={22} />}
          title="Calendar"
          hint="See the trip by day"
        />
        <HubTile
          onClick={() => {setDocumentPanel(true)}}
          icon={<FileText size={22} />}
          title="Documents"
          hint="Tickets, bookings, and notes"
        />
        <HubTile
          tone="outline"
          className="col-span-2"
          href={`${base}/explore`}
          icon={<Compass size={22} />}
          title="Explore"
          hint="Find things to do and add them to your trip"
        />
        <HubTile
          onClick={() => { setBookmarkPanel(true); fetchBookmarks() }}
          icon={<Bookmark size={22} />}
          title="Saved ideas"
          hint={loadingBookmarks ? "Loading..." : savedIdeas.length === 0 ? "Nothing saved yet" : `${savedIdeas.length} waiting for a day`}
        />
        <HubTile
          href={`${base}/documents`}
          icon={<Users size={22}/>}
          title="Agent Atlas"
          hint="Your Personal Travel Agent"
        />

      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowClearModal(true)}
          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-full transition-all cursor-pointer"
        >
          Clear Itinerary
        </button>
      </div>

        {/*Documents Panel */}
        {documentsPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDocumentPanel(false)} />
          <div className="relative z-10 w-full max-w-3/5 bg-white h-3/5 shadow-2xl flex flex-col overflow-y-auto rounded-2xl" >
            <DocumentsPanel tripId={trip.id}/>
              
            <button onClick={() => setDocumentPanel(false)} className=" absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition cursor-pointer"><X size={20} /></button>
              
            </div></div>
        )}
        {/* BOOKMARKS SIDE PANEL */}
        {bookmarkPanel && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setBookmarkPanel(false)} />
            <div className="relative z-10 w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bookmark size={18} className="text-gray-700" />
                  <h2 className="text-base font-semibold text-gray-900">Saved ideas</h2>
                </div>
                <button onClick={() => setBookmarkPanel(false)} className="text-gray-400 hover:text-gray-600 transition cursor-pointer"><X size={20} /></button>
              </div>
                <div className="flex-1 p-4 flex flex-col gap-5">
                  {loadingBookmarks ? (
                    <div className="flex items-center justify-center mt-8"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
                  ) : savedIdeas.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center mt-8">No saved ideas yet.</p>
                  ) : (
                    trip.days.map((day, index) => {
                      const ideas = savedIdeas.filter(i => i.day === day.date)
                      if (ideas.length === 0) return null
                      return (
                        <div key={day.id}>
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            Day {index + 1}
                            {day.date && ` · ${new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          </h3>
                          <div className="flex flex-col gap-3">
                            {ideas.map(idea => (
                              <BookmarkCard key={idea.id} idea={idea} tripId={trip.id} days={trip.days}
                                onAdded={() => { setBookmarkPanel(false); router.refresh() }}
                                onDelete={() => handleDeleteWidget(idea.id)} />
                            ))}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
            </div>
          </div>
        )}

        {/* INVITE MODAL */}
        {inviteModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) setInviteModal(false) }}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Invite Friends</h2>
                <button onClick={() => setInviteModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
              </div>
              <div className="flex border-b border-gray-200">
                {(["link", "email", "travelers"] as InviteTab[]).map(tab => (
                  <button key={tab} onClick={() => setInviteTab(tab)}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-all cursor-pointer ${inviteTab === tab ? "border-yellow-400 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
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
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${copied ? "bg-green-100 text-green-700" : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"}`}>
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
                      onChange={e => setEmailInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSendInvite() }}
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all" />
                    <button onClick={handleSendInvite} className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer">Send</button>
                  </div>
                  {sentInvites.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent invites</span>
                      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                        {sentInvites.map(email => (
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
                    {travelers.map(t => (
                      <div key={t.id} className="flex items-center gap-3">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-sm font-semibold text-yellow-800">{t.name.charAt(0)}</div>
                        )}
                        <span className="flex-1 text-sm text-gray-800">
                          {t.name}
                          {t.role && <span className="ml-2 text-xs text-gray-400 capitalize">{t.role}</span>}
                        </span>
                        {t.role !== "owner" && (
                          <button
                            onClick={() => setTravelerToRemove({ id: t.id, name: t.name })}
                            className="text-gray-300 hover:text-red-400 hover:bg-red-50 p-1 rounded transition-all cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {travelers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No travelers yet.</p>}
                  </div>
                </div>
              )}

              {/* REMOVE TRAVELER CONFIRMATION MODAL */}
              {travelerToRemove && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) setTravelerToRemove(null) }}>
                  <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-lg font-bold text-gray-900">Remove traveler?</h2>
                      <p className="text-sm text-gray-500">Are you sure you want to remove {travelerToRemove.name} from this trip? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setTravelerToRemove(null)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer">Cancel</button>
                      <button onClick={confirmRemoveTraveler} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                        Yes, remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLEAR CONFIRMATION MODAL */}
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) setShowClearModal(false) }}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-gray-900">Clear itinerary?</h2>
                <p className="text-sm text-gray-500">This will remove all events, dates, location, and the cover photo. This cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowClearModal(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button onClick={handleClearItinerary} disabled={clearing} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer">
                  {clearing ? <><Loader2 size={14} className="animate-spin" /> Clearing...</> : "Yes, clear it"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* START FORWARD CONFIRMATION MODAL */}
        {startForwardConflict && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-gray-900">Adjust trip dates?</h2>
                <p className="text-sm text-gray-500">
                  Moving the start date forward will shift all events to maintain their relative position.
                  The end date will be adjusted to <span className="font-medium text-gray-700">{startForwardConflict.suggestedEnd}</span>.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStartForwardConflict(null); setStartDate(trip.startDate || "") }} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button onClick={handleConfirmStartForward} className="flex-1 py-2.5 text-sm font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-all cursor-pointer">Adjust end date</button>
              </div>
            </div>
          </div>
        )}

    </div>
  )
}