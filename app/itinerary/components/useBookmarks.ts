import { useState, useEffect, useCallback } from "react"
import { Widget } from "../types/types"

export function useBookmarks(tripId: string) {
  const [bookmarkMap, setBookmarkMap] = useState<Record<string, string>>({}) // title+location -> id
  const [loading, setLoading] = useState(true)

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch(`/api/auth/widgets?itinerary_id=${tripId}`)
      const data: Widget[] = await res.json()
      const map: Record<string, string> = {}
      if (Array.isArray(data)) {
        data.forEach(w => {
          const key = `${w.title}__${w.location ?? ""}`
          map[key] = w.id
        })
      }
      setBookmarkMap(map)
    } catch {
      setBookmarkMap({})
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  useEffect(() => {
    window.addEventListener('widget-bookmarked', fetchBookmarks)
    return () => window.removeEventListener('widget-bookmarked', fetchBookmarks)
  }, [fetchBookmarks])

  function isBookmarked(title: string, location?: string): boolean {
    return !!bookmarkMap[`${title}__${location ?? ""}`]
  }

  function getSavedId(title: string, location?: string): string | null {
    return bookmarkMap[`${title}__${location ?? ""}`] ?? null
  }

  async function toggleBookmark(widget: Widget) {
    const key = `${widget.title}__${widget.location ?? ""}`
    const existingId = bookmarkMap[key]

    if (existingId) {
      // optimistically remove
      setBookmarkMap(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      try {
        await fetch(`/api/auth/widgets?id=${existingId}`, { method: 'DELETE' })
        window.dispatchEvent(new CustomEvent('widget-bookmarked'))
      } catch {
        // revert on failure
        setBookmarkMap(prev => ({ ...prev, [key]: existingId }))
      }
    } else {
      // optimistically add with a temp id
      const tempId = 'temp-' + crypto.randomUUID()
      setBookmarkMap(prev => ({ ...prev, [key]: tempId }))
      try {
        const res = await fetch('/api/auth/widgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itinerary_id: tripId,
            title: widget.title,
            type: widget.type,
            location: widget.location,
            description: widget.description,
            image_url: widget.image_url,
            rating: widget.rating,
            price: widget.price,
          }),
        })
        const json = await res.json()
        const realId = json?.id ?? null
        // replace temp id with real id
        setBookmarkMap(prev => ({ ...prev, [key]: realId }))
        window.dispatchEvent(new CustomEvent('widget-bookmarked'))
      } catch {
        // revert on failure
        setBookmarkMap(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }
    }
  }

  return { isBookmarked, getSavedId, toggleBookmark, loading, refetch: fetchBookmarks }
}