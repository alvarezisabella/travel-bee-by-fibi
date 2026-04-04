import { useState } from "react";
import { Widget, LABEL_MAP } from "../types/types";
import { X, Loader2, Check } from "lucide-react";
import { Day } from "../day";
import { createClient } from "@/lib/supabase/client"
import { insertEvent } from "@/lib/supabase/event"


export function BookmarkCard({ idea, tripId, days, onAdded, onDelete }: {
  idea: Widget
  tripId: string
  days: Day[]
  onAdded: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const bannerColor = LABEL_MAP[idea.type as keyof typeof LABEL_MAP]?.bar ?? "bg-gray-400"
  async function handleAdd() {
    if (!selectedDay) return
    setAdding(true)
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not logged in')

        const { data, error } = await insertEvent(supabase, {
        itinerary_id: tripId,
        day: selectedDay,
        title: idea.title,
        description: idea.description ?? '',
        type: 'Activity',
        status: 'Pending',
        created_by: user.id,
        })

        if (error) throw new Error(error.message)

        // Notify TripList to add the event instantly
        window.dispatchEvent(new CustomEvent('bookmark-added', {
        detail: {
            id: data.id,
            itineraryid: tripId,
            dayid: days.find(d => d.date === selectedDay)?.id,
            title: idea.title,
            description: idea.description ?? '',
            status: 'Pending',
            startTime: '',
            duration: 0,
            location: '',
            travelers: '',
            type: 'Activity',
            upvotes: 0,
            downvotes: 0,
        }
        }))

        setAdded(true)
        setTimeout(() => {
        setOpen(false)
        setAdded(false)
        setSelectedDay(null)
        onAdded()
        }, 1000)

    } finally {
        setAdding(false)
    }
    }

  return (
    <>
    {/* Card */}
    <div className="relative w-full text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
    
    {/* Clickable area */}
    <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        
        {/* Banner */}
        <div className={`w-full h-24 ${bannerColor} relative`}>
        {(idea as any).image_url && (
            <img src={(idea as any).image_url} className="w-full h-full object-cover" />
        )}
        {idea.type && (
            <div className="absolute top-2 left-2.5 bg-black/30 rounded-full px-2 py-0.5">
            <span className="text-[10px] font-medium text-white uppercase tracking-wide">
                {idea.type}
            </span>
            </div>
        )}
        </div>

        {/* Body */}
        <div className="p-3">
        <p className="text-sm font-medium text-gray-900 leading-snug">{idea.title}</p>
        {idea.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{idea.description}</p>
        )}
        {idea.location && (
            <p className="text-xs text-gray-400 mt-1">{idea.location}</p>
        )}
        </div>
    </button>

    {/* Delete button — outside the clickable button */}
    <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute top-2 right-2 bg-white/80 hover:bg-white border border-gray-200 rounded-full p-1 transition-all z-10"
    >
        <X size={12} className="text-gray-400 hover:text-gray-600" />
    </button>

    </div>

    {/* Detail modal */}
    {open && (
    <div className="mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">

        <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
            <div>
            <h3 className="text-base font-semibold text-gray-900">{idea.title}</h3>
            {idea.location && (
                <p className="text-xs text-gray-400 mt-0.5">{idea.location}</p>
            )}
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
            </button>
        </div>

        {idea.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{idea.description}</p>
        )}

        <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add to day</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((day, index) => (
                <button
                key={day.id}
                onClick={() => setSelectedDay(day.date ?? null)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border text-sm font-medium transition-all
                    ${selectedDay === day.date
                    ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-yellow-300'
                    }`}
                >
                <span className="block text-xs font-medium">Day {index + 1}</span>
                {day.date && (
                    <span className="block text-xs text-gray-400 font-normal">
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                )}
                </button>
            ))}
            </div>
        </div>

        <button
            onClick={handleAdd}
            disabled={adding || !selectedDay || added}
            className="w-full py-2.5 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-xl text-sm font-semibold text-gray-800 hover:from-yellow-400 hover:to-yellow-600 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
            {added
            ? <><Check size={14} /> Added!</>
            : adding
            ? <><Loader2 size={14} className="animate-spin" /> Adding...</>
            : "Add to itinerary"
            }
        </button>
        </div>
    </div>
    )}
    </>
  )
}