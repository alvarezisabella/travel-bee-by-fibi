import { useState, useEffect, useCallback } from "react"
import { Widget } from "@/app/itinerary/types/types"

// query is an already submitted search, never live keystrokes. Debouncing
// typing still leaked a paid call per hesitation mid word, so the page only
// calls this on Enter or the Search button.
// enabled is false when the category is filtered out by the active tab, so a
// hidden section doesn't spend a paid SerpAPI search
export function useExploreSearch(
  tripId: string,
  category: string,
  query: string,
  enabled = true
) {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!tripId || !enabled) {
      setLoading(false)
      return
    }

    let ignore = false

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/explore/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId, category, query }),
        })

        const json = await res.json()
        if (ignore) return

        if (!res.ok) {
          setError(json?.error ?? "We couldn't load recommendations right now.")
          setWidgets([])
          return
        }

        setWidgets(json.widgets ?? [])
      } catch {
        if (!ignore) {
          setError("We couldn't load recommendations right now.")
          setWidgets([])
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    run()

    // ignore guards against a slow earlier request landing after a newer one
    return () => {
      ignore = true
    }
  }, [tripId, category, query, reloadKey, enabled])

  return { widgets, loading, error, retry }
}
