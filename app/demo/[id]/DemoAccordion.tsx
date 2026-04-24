// app/demo/[id]/DemoAccordion.tsx
"use client"

import { useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import { DemoDay } from '../demoData'

const TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  Activity:    { bg: "bg-[#fff3cd]", text: "text-[#7d5a00]" },
  Transit:     { bg: "bg-[#dce8f5]", text: "text-[#1e4a72]" },
  Reservation: { bg: "bg-[#fde8c8]", text: "text-[#7a3e00]" },
  Food:        { bg: "bg-[#fce4ec]", text: "text-[#7b1a35]" },
}

const TYPE_THUMB: Record<string, string> = {
  Activity:    "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=200&q=80",
  Transit:     "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&q=80",
  Reservation: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80",
  Food:        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80",
}

function formatTime(time: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatDuration(mins: number) {
  if (!mins) return ''
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}.${Math.round((m / 60) * 10)} hours` : `${h} hour${h !== 1 ? 's' : ''}`
}

export default function DemoAccordion({ days }: { days: DemoDay[] }) {
  const [openDays, setOpenDays] = useState<Set<string>>(
    new Set(days.map(d => d.id))
  )

  function toggleDay(id: string) {
    setOpenDays(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <>
      {days.map((day, idx) => {
        const isOpen = openDays.has(day.id)
        const dateLabel = new Date(day.date).toLocaleDateString('en-US', {
          weekday: 'long', month: 'short', day: 'numeric',
        })

        return (
          <div key={day.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <button
              onClick={() => toggleDay(day.id)}
              className="w-full flex items-center gap-4 px-6 py-5 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-[16px] transition-colors duration-200 ${
                isOpen ? 'bg-[#F5C300] text-[#3d3000]' : 'bg-gray-100 text-gray-500'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[16px] text-gray-900">Day {day.id}</p>
                <p className="text-[13px] text-gray-400">{dateLabel}</p>
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {day.events.map((event) => {
                  const badge = TYPE_BADGE[event.type] ?? TYPE_BADGE['Activity']
                  const thumb = TYPE_THUMB[event.type] ?? TYPE_THUMB['Activity']

                  return (
                    <div key={event.id} className="flex items-stretch px-6 py-5 gap-5">
                      <div className="w-[110px] h-[110px] rounded-2xl overflow-hidden shrink-0">
                        <img src={thumb} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[12px] font-medium text-gray-500 flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {formatTime(event.startTime)}
                          </span>
                          {event.duration > 0 && (
                            <span className="text-[12px] text-gray-400">· {formatDuration(event.duration)}</span>
                          )}
                        </div>
                        <p className="text-[16px] font-semibold text-gray-900 leading-snug mb-2">{event.title}</p>
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2 ${badge.bg} ${badge.text}`}>
                          {event.type}
                        </span>
                        <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2">{event.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}