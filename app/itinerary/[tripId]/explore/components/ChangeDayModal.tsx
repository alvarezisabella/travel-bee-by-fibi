"use client"
import { useState } from "react"
import { X } from "lucide-react"
import type { Widget } from "@/app/itinerary/types/types"
import type { Day } from "@/app/itinerary/day"

interface ChangeDayModalProps {
  widget: Widget
  days: Day[]
  currentDayId?: string
  onClose: () => void
  onConfirm: (day: Day) => void
}

export function ChangeDayModal({ widget, days, currentDayId, onClose, onConfirm }: ChangeDayModalProps) {
  const [selectedDay, setSelectedDay] = useState<Day | null>(
    days.find((d) => d.id === currentDayId) ?? null
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            Save "{widget.title}" to
          </h3>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-3">
          {widget.image_url && (
            <img
              src={widget.image_url}
              alt={widget.title}
              className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
            />
          )}

          <div className="flex max-h-48 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {days.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day)}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                  selectedDay?.id === day.id
                    ? "border-amber-400 bg-amber-50 text-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-amber-200"
                }`}
              >
                <span className="font-medium">Day {index + 1}</span>
                {day.date && (
                  <span className="text-xs text-slate-400">
                    {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => selectedDay && onConfirm(selectedDay)}
          disabled={!selectedDay}
          className="mt-4 w-full cursor-pointer rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  )
}