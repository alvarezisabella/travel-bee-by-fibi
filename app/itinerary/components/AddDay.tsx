"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

export default function AddDayButton() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [savedDates, setSavedDates] = useState<string[]>([])

  const handleSave = () => {
    if (!date) return

    setSavedDates([...savedDates, date])
    setDate("")
    setOpen(false)
  }

  return (
    <div className="mt-6">

      {/* Add Day Button */}
      <button
        onClick={() => setOpen(true)}
        className="
          w-full max-w-6xl mx-auto
          flex items-center justify-center gap-2
          bg-gray-100
          border border-orange-400
          rounded-xl
          py-4
          text-lg font-medium
          hover:bg-gray-200
          transition
        "
      >
      <Plus size={20} className="text-orange-500" />
      Add Day
      </button>

      {/* Date Modal */}
      {open && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow w-[250px] mx-auto">

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded p-2 w-full"
          />

          <button
            onClick={handleSave}
            className="bg-yellow-400 px-3 py-1 rounded mt-2 w-full"
          >
            Save
          </button>

        </div>
      )}

      {/* Display Saved Days */}
      <div className="mt-4 space-y-2 w-full max-w-6xl mx-auto">

      {savedDates.map((d, index) => (
        <div
          key={index}
          className="
            bg-amber-100
            rounded-xl
            shadow-sm
            p-5
            w-full
            max-w-6xl
            mx-auto
          "
        >
          <h2 className="text-xl font-semibold">
            Day {index + 1}
          </h2>

          <p className="text-gray-700 mt-1">
            {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      ))}

      </div>

    </div>
  )
}