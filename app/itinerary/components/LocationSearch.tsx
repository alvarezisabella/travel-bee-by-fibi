"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, X } from "lucide-react"
import { WORLD_LOCATIONS } from "../data/worldLocations"

interface Props {
  value: string
  onChange: (val: string) => void
  onClose?: () => void
}

export default function LocationSearch({ value, onChange, onClose }: Props) {
  const [query, setQuery] = useState(value === "Add location" ? "" : value)
  const [open, setOpen] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Select all text on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const filtered = query.trim().length === 0
    ? []
    : WORLD_LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        onClose?.()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const handleSelect = (loc: string) => {
    setQuery(loc)
    onChange(loc)
    setOpen(false)
    onClose?.()
  }

  const handleClear = () => {
    setQuery("")
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 bg-white focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-100 transition-all">
        <MapPin size={15} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={(e) => { e.target.select(); setOpen(true) }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); onClose?.() }
            if (e.key === "Enter") {
              if (filtered.length > 0) {
                handleSelect(filtered[0])
              } else if (query.trim().length > 0) {
                onChange(query.trim())
                onClose?.()
              }
            }
          }}
          placeholder="Search city or country..."
          className="flex-1 text-sm outline-none text-gray-700 bg-transparent placeholder-gray-400"
        />
        {query && (
          <button onClick={handleClear} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && filtered.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {filtered.map((loc) => {
            const parts = loc.split(", ")
            const city = parts[0]
            const country = parts.slice(1).join(", ")
            return (
              <li key={loc}>
                <button
                  onClick={() => handleSelect(loc)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-yellow-50 transition-colors"
                >
                  <MapPin size={13} className="text-yellow-500 shrink-0" />
                  <span className="text-sm text-gray-800">{city}</span>
                  {country && (
                    <span className="text-xs text-gray-400 ml-auto">{country}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* No results hint */}
      {open && query.trim().length > 0 && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 px-4 py-3">
          <p className="text-sm text-gray-400">
            No matches — press <span className="font-medium text-gray-600">Enter</span> to use{" "}
            <span className="font-medium text-gray-700">"{query}"</span>
          </p>
        </div>
      )}
    </div>
  )
}