"use client"

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="absolute top-5 left-6 bg-white/20 backdrop-blur-sm text-white text-[13px] font-medium px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
    >
      ← Back
    </button>
  )
}