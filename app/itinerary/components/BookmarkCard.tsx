import { useState } from "react";
import { Widget } from "../types/types";
import { X, Loader2, Check } from "lucide-react";
import { Day } from "../day";
import { createClient } from "@/lib/supabase/client"
import { insertEvent } from "@/lib/supabase/event"


export function BookmarkCard({ idea, tripId, days, onAdded }: {
  idea: Widget
  tripId: string
  days: Day[]
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
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
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3.5 transition-all"
      >
        <p className="text-sm font-medium text-gray-900">{idea.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{idea.location}</p>
      </button>

      {/* Detail modal */}
      {open && (
        <div
          className="flex items-end justify-center bg-black/40"  
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white w-full max-w-sm drop-shadow-sm">

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
        </div>
      )}
    </>
  )
}