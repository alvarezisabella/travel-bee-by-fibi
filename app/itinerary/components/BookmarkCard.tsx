import { useState } from "react";
import { Widget } from "../types/types";
import { X, Loader2 } from "lucide-react";

export function BookmarkCard({ idea, tripId, onAdded }: {
  idea: Widget
  tripId: string
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const handleAdd = async () => {
    setAdding(true)
    await fetch('/api/auth/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        itinerary_id: tripId,
        title: idea.title,
        description: idea.description,
        location: idea.location,
        }),
    })
    setAdding(false)
    setOpen(false)
    onAdded()
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
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-white w-full max-w-sm rounded-t-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-gray-900">{idea.title}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500">{idea.description}</p>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full py-2.5 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-xl text-sm font-semibold text-gray-800 hover:from-yellow-400 hover:to-yellow-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {adding ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : "Add to itinerary"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}