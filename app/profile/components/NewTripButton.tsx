"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function NewTripButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleNewTrip = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (res.ok && data.itinerary?.id) {
        router.push(`/itinerary/${data.itinerary.id}`)
      }
    } catch (err) {
      console.error("Failed to create trip:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleNewTrip}
      disabled={loading}
      className="h-8 px-4 bg-[#F5C842] hover:bg-[#e6b93a] rounded-full flex items-center justify-center text-xs font-semibold text-gray-900 transition-all disabled:opacity-50 gap-1.5"
    >
      {loading ? <><Loader2 size={12} className="animate-spin" /> Creating...</> : "+ New Trip"}
    </button>
  )
}