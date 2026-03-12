"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

export default function AddDay() {
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState("")
  const [savedDates, setSavedDates] = useState<string[]>([])

  const handleSave = () => {
    if (!date) return

    setSavedDates([...savedDates, date])
    setDate("")
    setAdding(false)
  }

  const handleDelete = (indexToDelete: number) => {
    setSavedDates(savedDates.filter((_, i) => i !== indexToDelete))
  }

  return (
    <div className="mt-6 w-full max-w-6xl mx-auto space-y-4">

      {/* DAYS */}
      {savedDates.map((d, index) => (
        <div key={index}>

          <div className="bg-amber-100 rounded-xl shadow-sm p-5">

            <div className="flex justify-between items-center">

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
          {index === savedDates.length - 1 && !adding && (
            <button
              onClick={() => setAdding(true)}
              className="
                w-full flex items-center justify-center gap-2
                bg-gray-100 border border-orange-400
                rounded-xl py-3 mt-3
                hover:bg-gray-200
              "
            >
              <Plus size={18} className="text-orange-500"/>
              Add Day
            </button>
          )}

          {/* DATE PICKER */}
          {index === savedDates.length - 1 && adding && (
            <div className="mt-3 bg-white p-4 rounded-lg shadow w-[260px]">

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded p-2 w-full"
              />

              <button
                onClick={handleSave}
                className="bg-yellow-400 px-3 py-2 rounded mt-3 w-full hover:bg-yellow-500"
              >
                Save
              </button>

            </div>
          )}

        </div>
      ))}

      {/* EMPTY STATE */}
      {savedDates.length === 0 && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="
            w-full flex items-center justify-center gap-2
            bg-gray-100 border border-orange-400
            rounded-xl py-4
            text-lg
          "
        >
          <Plus size={20} className="text-orange-500"/>
          Add Day
        </button>
      )}

      {savedDates.length === 0 && adding && (
        <div className="bg-white p-4 rounded-lg shadow w-[260px]">

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded p-2 w-full"
          />

          <button
            onClick={handleSave}
            className="bg-yellow-400 px-3 py-2 rounded mt-3 w-full hover:bg-yellow-500"
          >
            Save
          </button>

        </div>
      )}

    </div>
  )
}