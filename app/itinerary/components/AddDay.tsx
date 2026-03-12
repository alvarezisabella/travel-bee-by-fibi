"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

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

  const handleDelete = (indexToDelete: number) => {
    const updated = savedDates.filter((_, i) => i !== indexToDelete)
    setSavedDates(updated)
  }

  return (
    <div className="mt-6">

      {/* Add Day Button */}
      {savedDates.length === 0 && (
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
      )}

      {/* Display Saved Days */}
      <div className="mt-4 space-y-4 w-full max-w-6xl mx-auto">

        {savedDates.map((d, index) => (
          <div key={index}>

            {/* DAY CARD */}
            <div className="bg-amber-100 rounded-xl shadow-sm p-5 w-full">

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-semibold">
                  Day {index + 1}
                </h2>

                <button
                  onClick={() => handleDelete(index)}
                  className="p-2 rounded-md hover:bg-red-200"
                >
                  <Trash2 size={18}/>
                </button>

              </div>

              <p className="text-gray-700 mt-1">
                {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

            </div>

            {/* ADD BUTTON AFTER LAST DAY */}
            {index === savedDates.length - 1 && (
              <button
                onClick={() => setOpen(true)}
                className="
                  w-full flex items-center justify-center gap-2
                  bg-gray-100 border border-orange-400
                  rounded-xl py-3 mt-3
                "
              >
                <Plus size={18} className="text-orange-500"/>
                Add Day
              </button>
            )}

          </div>
        ))}

      </div>

      {/* DATE MODAL (OUTSIDE MAP) */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">

          <div className="bg-white p-6 rounded-xl shadow-lg w-[280px]">

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded p-2 w-full"
            />

            <button
              onClick={handleSave}
              className="bg-yellow-400 px-3 py-2 rounded mt-3 w-full"
            >
              Save
            </button>

          </div>

        </div>
      )}

    </div>
  )
}