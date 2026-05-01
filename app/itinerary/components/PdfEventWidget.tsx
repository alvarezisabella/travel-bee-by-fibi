import React, { useState, useEffect } from "react"
import { Check, Loader2, FileText } from "lucide-react"
import { PdfEventData, EventLabel, LABEL_MAP, Trip } from "../types/types"
import { Day } from "../day"
import { createClient } from "@/lib/supabase/client"
import { insertEvent } from "@/lib/supabase/event"
import bc from "@/styles/bookmarkcard.module.css"
import w from "@/styles/widgets.module.css"

interface PdfEventWidgetProps {
  pdfEvent: PdfEventData
  tripId: string
  days: Day[]
  trip: Trip
  onAdded?: (title: string) => void
}

const EVENT_TYPES: EventLabel[] = ["Activity", "Transit", "Reservation", "Food"]

function matchingDay(days: Day[], date: string | undefined): string | null {
  if (!date) return null
  return days.find((d) => d.date === date)?.date ?? null
}

function isDateInTrip(trip: Trip, date: string): boolean {
  if (!trip.startDate || !trip.endDate) return true
  return date >= trip.startDate && date <= trip.endDate
}

export const PdfEventWidget: React.FC<PdfEventWidgetProps> = ({
  pdfEvent, tripId, days, trip, onAdded,
}) => {
  const [title, setTitle] = useState(pdfEvent.title ?? "")
  const [date, setDate] = useState(pdfEvent.date ?? "")
  const [startTime, setStartTime] = useState(pdfEvent.startTime ?? "")
  const [endTime, setEndTime] = useState(pdfEvent.endTime ?? "")
  const [location, setLocation] = useState(pdfEvent.location ?? "")
  const [type, setType] = useState<EventLabel>(pdfEvent.type ?? "Reservation")
  const [selectedDay, setSelectedDay] = useState<string | null>(
    matchingDay(days, pdfEvent.date)
  )

  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  // Sync selectedDay when the date field changes
  useEffect(() => {
    if (!date) {
      setSelectedDay(null)
      return
    }
    const match = days.find((d) => d.date === date)
    setSelectedDay(match?.date ?? null)
  }, [date, days])

  const dateOutOfRange = date !== "" && !isDateInTrip(trip, date)

  async function handleAdd() {
    if (!selectedDay || adding || added) return
    setAdding(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in")

      const { data, error } = await insertEvent(supabase, {
        itinerary_id: tripId,
        day: selectedDay,
        title: title.trim() || "Untitled Event",
        description: pdfEvent.description ?? "",
        type,
        status: "Confirmed",
        starts_at: startTime || undefined,
        ends_at: endTime || undefined,
        location: location.trim() || undefined,
        created_by: user.id,
      })

      if (error) throw new Error(error.message)

      window.dispatchEvent(new CustomEvent("bookmark-added", {
        detail: {
          id: data.id,
          itineraryid: tripId,
          dayid: days.find((d) => d.date === selectedDay)?.id,
          title: title.trim() || "Untitled Event",
          description: pdfEvent.description ?? "",
          status: "Confirmed",
          startTime: startTime || "",
          duration: 0,
          location: location.trim() || "",
          travelers: "",
          type,
          upvotes: 0,
          downvotes: 0,
        },
      }))

      setAdded(true)
      onAdded?.(title.trim() || "Untitled Event")
    } finally {
      setAdding(false)
    }
  }

  const accentColor = LABEL_MAP[type]?.bar ?? ""

  function extractHex(twClass: string): string {
    const match = twClass.match(/#([0-9a-fA-F]{3,6})/)
    return match ? `#${match[1]}` : "#e5e7eb"
  }

  return (
    <div className={w.card} style={{ marginTop: "0.5rem" }}>
      {/* Banner */}
      <div className={w.banner} style={{ backgroundColor: extractHex(accentColor), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FileText size={32} color="rgba(255,255,255,0.7)" />
        <div className={w.bannerBadge}>
          <span className={w.bannerBadgeText}>From PDF</span>
        </div>
      </div>

      <div className={bc.modalBody}>
        {/* Editable fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Field label="Title">
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <Field label="Date">
              <input
                style={inputStyle}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Type">
              <select
                style={inputStyle}
                value={type}
                onChange={(e) => setType(e.target.value as EventLabel)}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <Field label="Start time">
              <input
                style={inputStyle}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>
            <Field label="End time">
              <input
                style={inputStyle}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Location">
            <input
              style={inputStyle}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Venue or address"
            />
          </Field>
        </div>

        {/* Date out-of-range warning */}
        {dateOutOfRange && (
          <div style={{
            padding: "0.625rem 0.75rem",
            backgroundColor: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: "0.625rem",
            fontSize: "0.75rem",
            color: "#92400e",
            lineHeight: 1.5,
          }}>
            This date is outside your trip. Did you upload the wrong file, or would you like to adjust your trip dates?
          </div>
        )}

        {/* Day picker — only shown when date is valid or not set */}
        {!dateOutOfRange && (
          <div className={bc.dayPicker}>
            <p className={bc.dayPickerLabel}>Add to day</p>
            <div className={bc.dayPickerScroll}>
              {days.map((day, index) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.date ?? null)}
                  className={`${bc.dayBtn} ${selectedDay === day.date ? bc.dayBtnSelected : ""}`}
                >
                  <span className={bc.dayBtnLabel}>Day {index + 1}</span>
                  {day.date && (
                    <span className={bc.dayBtnDate}>
                      {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={adding || added || !selectedDay || dateOutOfRange}
          className={bc.addBtn}
        >
          {added
            ? <><Check size={14} /> Added!</>
            : adding
            ? <><Loader2 size={14} className={bc.spinner} /> Adding…</>
            : "Add to Trip"}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.375rem 0.5rem",
  fontSize: "0.8125rem",
  border: "1px solid #e5e7eb",
  borderRadius: "0.5rem",
  background: "#f9fafb",
  color: "#111827",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
    <label style={{ fontSize: "0.6875rem", fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
    </label>
    {children}
  </div>
)
