"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, X, Loader2 } from "lucide-react"

interface PlaceSuggestion {
  placeId: string
  description: string
}

interface Coords {
  lat: number
  lng: number
}

interface Props {
  value: string
  onChange: (val: string) => void
  onClose?: (val: string, coords?: Coords) => void
}

// Component for searching locations via the Google Places API, with a dropdown of suggestions
export default function LocationSearch({ value, onChange, onClose }: Props) {
  const [query, setQuery] = useState(value === "Add location" ? "" : value)
  const [open, setOpen] = useState(true)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const queryRef = useRef(query)
  const sessionTokenRef = useRef(crypto.randomUUID())

  useEffect(() => { queryRef.current = query }, [query])

  // Select all text on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  // Debounced fetch of Google Places autocomplete suggestions
  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query.trim(), sessionToken: sessionTokenRef.current }),
        })
        const data = await res.json()
        setSuggestions(res.ok ? (data.suggestions ?? []) : [])
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        onClose?.(queryRef.current)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  // Handles selecting a suggestion, resolves its coordinates, then reports it up
  const handleSelect = async (suggestion: PlaceSuggestion) => {
    setQuery(suggestion.description)
    onChange(suggestion.description)
    setOpen(false)
    setSuggestions([])

    const sessionToken = sessionTokenRef.current
    sessionTokenRef.current = crypto.randomUUID()

    try {
      const res = await fetch("/api/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: suggestion.placeId, sessionToken }),
      })
      const data = await res.json()
      onClose?.(suggestion.description, res.ok ? { lat: data.lat, lng: data.lng } : undefined)
    } catch {
      onClose?.(suggestion.description)
    }
  }

  // Handles clearing the search input, resets query
  const handleClear = () => {
    setQuery("")
    onChange("")
    setSuggestions([])
    inputRef.current?.focus()
  }

  // Renders the search input and dropdown suggestions based on the query
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
            if (e.key === "Escape") { setOpen(false); onClose?.(query) }
            if (e.key === "Enter") {
              if (suggestions.length > 0) {
                handleSelect(suggestions[0])
              } else if (query.trim().length > 0) {
                onChange(query.trim())
                onClose?.(query.trim())
              }
            }
          }}
          placeholder="Search city or country..."
          className="flex-1 text-sm outline-none text-gray-700 bg-transparent placeholder-gray-400"
        />
        {loading && <Loader2 size={14} className="text-gray-300 shrink-0 animate-spin" />}
        {!loading && query && (
          <button onClick={handleClear} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-yellow-50 transition-colors"
              >
                <MapPin size={13} className="text-yellow-500 shrink-0" />
                <span className="text-sm text-gray-800">{s.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* No results hint */}
      {open && !loading && query.trim().length > 0 && suggestions.length === 0 && (
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
