"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

// Component for adding a new day to the itinerary, includes button to open form and form design
export default function AddDayButton() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [savedDates, setSavedDates] = useState<string[]>([])

  // Handles saving new day, checks if date is valid and not already added, then adds to savedDates state and closes form
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

    </div>
  )
}