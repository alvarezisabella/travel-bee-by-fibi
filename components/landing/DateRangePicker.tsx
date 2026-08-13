// components/landing/DateRangePicker.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { Calendar } from "lucide-react"

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"]

function toKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
function fmt(d: Date) {
  return `${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getDate().toString().padStart(2,"0")}/${d.getFullYear()}`
}

interface CalendarPopupProps {
  viewDate: Date
  startDate: Date | null
  endDate: Date | null
  which: "start" | "end"
  onShift: (dir: number) => void
  onPick: (date: Date) => void
}

function CalendarPopup({ viewDate, startDate, endDate, which, onShift, onPick }: CalendarPopupProps) {
  const today = new Date(); today.setHours(0,0,0,0)
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const last = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0)

  const days = []
  // Leading empty cells
  for (let i = 0; i < first.getDay(); i++) {
    days.push(<div key={`e-${i}`} />)
  }
  // Actual days
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d)
    date.setHours(0,0,0,0)
    const isStart = startDate && toKey(date) === toKey(startDate)
    const isEnd = endDate && toKey(date) === toKey(endDate)
    const inRange = startDate && endDate && date > startDate && date < endDate
    const isToday = toKey(date) === toKey(today)
    const disabled = which === "end"
      ? (startDate ? date < startDate : false)
      : date < today

    let cls = "w-8 h-8 flex items-center justify-center text-[13px] relative cursor-pointer select-none "
    if (disabled) {
      cls += "text-gray-300 cursor-default "
    } else if (isStart && isEnd) {
      cls += "bg-[#F5C300] text-[#3d3000] font-medium rounded-lg "
    } else if (isStart) {
      cls += "bg-[#F5C300] text-[#3d3000] font-medium rounded-l-lg "
    } else if (isEnd) {
      cls += "bg-[#FF8C00] text-white font-medium rounded-r-lg "
    } else if (inRange) {
      cls += "bg-yellow-50 text-[#92600a] rounded-none "
    } else {
      cls += "hover:bg-yellow-50 hover:text-[#92600a] rounded-lg "
    }

    days.push(
      <div
        key={d}
        className={cls}
        onClick={() => !disabled && onPick(date)}
      >
        {d}
        {isToday && !isStart && !isEnd && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F5C300]" />
        )}
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-2xl p-4 z-50 shadow-lg w-[272px]">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onShift(-1)}
          className="w-7 h-7 rounded-lg border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors cursor-pointer"
        >‹</button>
        <span className="text-[14px] font-medium text-gray-900">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          onClick={() => onShift(1)}
          className="w-7 h-7 rounded-lg border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-500 text-base transition-colors cursor-pointer"
        >›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="w-8 h-6 flex items-center justify-center text-[11px] font-medium text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days}
      </div>
    </div>
  )
}

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onStartChange: (d: Date | null) => void
  onEndChange: (d: Date | null) => void
}

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) {
  const [openCal, setOpenCal] = useState<"start" | "end" | null>(null)
  const [startView, setStartView] = useState(new Date())
  const [endView, setEndView] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenCal(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function openStart() {
    setOpenCal(prev => prev === "start" ? null : "start")
  }

  function openEnd() {
    // Open end calendar on the same month as start date
    if (startDate) setEndView(new Date(startDate.getFullYear(), startDate.getMonth(), 1))
    setOpenCal(prev => prev === "end" ? null : "end")
  }

  function pickStart(d: Date) {
    onStartChange(d)
    // Clear end date if it's before new start
    if (endDate && endDate <= d) onEndChange(null)
    setOpenCal(null)
  }

  function pickEnd(d: Date) {
    onEndChange(d)
    setOpenCal(null)
  }

  const nights = startDate && endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
    : null

  const labelCls = "block text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-1.5"

  return (
    <div ref={containerRef} className="flex flex-col sm:flex-row border-b border-gray-100">

      {/* Start date */}
      <div className="flex-[5] p-4 px-4 sm:px-6 border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col items-center justify-center text-center relative">
        <span className={labelCls}>Start date</span>
        <button
          onClick={openStart}
          className="flex items-center justify-center gap-2 cursor-pointer bg-transparent border-none outline-none"
        >
          <Calendar size={14} className="text-gray-400 opacity-50" />
          <span className={`text-[15px] ${startDate ? "text-gray-900" : "text-gray-300"}`}>
            {startDate ? fmt(startDate) : "Select date"}
          </span>
        </button>
        {openCal === "start" && (
          <CalendarPopup
            viewDate={startView}
            startDate={startDate}
            endDate={endDate}
            which="start"
            onShift={dir => setStartView(v => new Date(v.getFullYear(), v.getMonth()+dir, 1))}
            onPick={pickStart}
          />
        )}
      </div>

      {/* End date */}
      <div className="flex-[5] p-4 px-4 sm:px-6 border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col items-center justify-center text-center relative">
        <span className={labelCls}>End date</span>
        <button
          onClick={openEnd}
          className="flex items-center justify-center gap-2 cursor-pointer bg-transparent border-none outline-none"
        >
          <Calendar size={14} className="text-gray-400 opacity-50" />
          <span className={`text-[15px] ${endDate ? "text-gray-900" : "text-gray-300"}`}>
            {endDate ? fmt(endDate) : "Select date"}
          </span>
        </button>
        {openCal === "end" && (
          <CalendarPopup
            viewDate={endView}
            startDate={startDate}
            endDate={endDate}
            which="end"
            onShift={dir => setEndView(v => new Date(v.getFullYear(), v.getMonth()+dir, 1))}
            onPick={pickEnd}
          />
        )}
      </div>

      {/* Duration */}
      <div className="flex-[3] p-4 px-4 sm:px-6 flex flex-col items-center justify-center text-center">
        <span className={labelCls}>Duration</span>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm opacity-50">⏱</span>
          <span className={`text-[15px] font-medium ${nights ? "text-[#d4a800]" : "text-gray-300"}`}>
            {nights ? `${nights} night${nights !== 1 ? "s" : ""}` : "—"}
          </span>
        </div>
      </div>

    </div>
  )
}