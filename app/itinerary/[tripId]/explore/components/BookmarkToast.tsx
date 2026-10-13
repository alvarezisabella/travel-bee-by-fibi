"use client"
import { useEffect } from "react"
import { Check, X } from "lucide-react"

interface BookmarkToastProps {
  dayLabel: string
  onChange: () => void
  onDismiss: () => void
}

export function BookmarkToast({ dayLabel, onChange, onDismiss }: BookmarkToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <Check className="h-4 w-4 flex-shrink-0 text-amber-400" />
      <span>Saved to {dayLabel}</span>
      <button
        onClick={onChange}
        className="cursor-pointer font-semibold text-amber-400 underline-offset-2 hover:underline"
      >
        Change
      </button>
      <button onClick={onDismiss} className="cursor-pointer text-slate-400 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}