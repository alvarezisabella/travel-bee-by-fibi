"use client"

import { useState, useRef, useEffect } from "react"
import { DayPicker, DateRange } from "react-day-picker"
import { Calendar } from "lucide-react"
import "react-day-picker/dist/style.css"

interface Props {
  startDate: string
  endDate: string
  onConfirm: (start: string, end: string) => void
}

export default function DateRangePicker({ startDate, endDate, onConfirm }: Props) {
  const [openPicker, setOpenPicker] = useState<"start" | "end" | null>(null)
  const [start, setStart] = useState<Date | undefined>(
    startDate ? new Date(startDate + "T00:00:00") : undefined
  )
  const [end, setEnd] = useState<Date | undefined>(
    endDate ? new Date(endDate + "T00:00:00") : undefined
  )
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenPicker(null)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const handleSelectStart = (date: Date | undefined) => {
    setStart(date)
    if (date && end && end < date) setEnd(undefined)
    setOpenPicker("end")
  }

  const handleSelectEnd = (date: Date | undefined) => {
    setEnd(date)
    if (date && start) {
      onConfirm(
        start.toISOString().split("T")[0],
        date.toISOString().split("T")[0]
      )
    }
    setOpenPicker(null)
  }

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <style>{`
        .rdp { --rdp-cell-size: 32px; --rdp-caption-font-size: 13px; font-size: 12px; margin: 0; }
        .rdp-day_button { border-radius: 9999px; width: 30px; height: 30px; font-size: 12px; }
        .rdp-selected .rdp-day_button { background-color: #F5C842 !important; color: #111 !important; font-weight: 600; }
        .rdp-range_start .rdp-day_button, .rdp-range_end .rdp-day_button { background-color: #F5C842 !important; color: #111 !important; font-weight: 600; }
        .rdp-range_middle .rdp-day_button { background-color: #FEF3C7 !important; color: #78350f !important; border-radius: 0 !important; }
        .rdp-range_start { border-radius: 9999px 0 0 9999px; background-color: #FEF3C7; }
        .rdp-range_end { border-radius: 0 9999px 9999px 0; background-color: #FEF3C7; }
        .rdp-day_button:hover { background-color: #FEF9EC !important; }
        .rdp-today .rdp-day_button { font-weight: 700; border: 1.5px solid #F5C842; }
      `}</style>

      <Calendar size={15} className="text-gray-400 shrink-0" />

      {/* Start date button */}
      <button
        onClick={() => setOpenPicker(openPicker === "start" ? null : "start")}
        className={`text-sm px-2 py-0.5 rounded-lg transition-colors ${
          openPicker === "start"
            ? "bg-yellow-100 text-yellow-800 font-medium"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        {start ? formatDate(start) : "Start date"}
      </button>

      <span className="text-gray-300 text-sm">–</span>

      {/* End date button */}
      <button
        onClick={() => setOpenPicker(openPicker === "end" ? null : "end")}
        className={`text-sm px-2 py-0.5 rounded-lg transition-colors ${
          openPicker === "end"
            ? "bg-yellow-100 text-yellow-800 font-medium"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        {end ? formatDate(end) : "End date"}
      </button>

      {/* Start date picker */}
      {openPicker === "start" && (
        <div className="absolute top-8 left-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-400 mb-2 text-center">Select a start date</p>
          <DayPicker
            mode="single"
            selected={start}
            onSelect={handleSelectStart}
            defaultMonth={start}
          />
        </div>
      )}

      {/* End date picker */}
      {openPicker === "end" && (
        <div className="absolute top-8 left-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-400 mb-2 text-center">Select an end date</p>
          <DayPicker
            mode="range"
            selected={{ from: start, to: end }}
            onSelect={(range) => handleSelectEnd(range?.to ?? range?.from)}
            disabled={start ? { before: start } : undefined}
            defaultMonth={start ?? end}
          />
        </div>
      )}
    </div>
  )
}