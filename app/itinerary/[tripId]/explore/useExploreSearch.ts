"use client"

import {
  useCallback,
  useEffect,
  useState,
} from "react"
import type { Widget } from "@/app/itinerary/types/types"

interface ExploreSearchResponse {
  widgets?: Widget[]
  error?: string
}

export function useExploreSearch(
  tripId: string,
  category: string,
  query: string,
  enabled = true,
) {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!tripId || !enabled) {
      setLoading(false)
      setError(null)
      setWidgets([])
      return
    }

    const controller = new AbortController()

    async function runSearch() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/explore/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripId,
            category,
            query: query.trim(),
          }),
          signal: controller.signal,
        })

        let result: ExploreSearchResponse = {}

        try {
          result =
            (await response.json()) as ExploreSearchResponse
        } catch {
          result = {}
        }

        if (controller.signal.aborted) {
          return
        }

        if (!response.ok) {
          setWidgets([])
          setError(
            result.error ??
              "We couldn't load recommendations right now.",
          )
          return
        }

        setWidgets(
          Array.isArray(result.widgets)
            ? result.widgets
            : [],
        )
      } catch (searchError) {
        if (
          searchError instanceof DOMException &&
          searchError.name === "AbortError"
        ) {
          return
        }

        if (!controller.signal.aborted) {
          setWidgets([])
          setError(
            "We couldn't connect to the recommendation service. Please try again.",
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    runSearch()

    return () => {
      controller.abort()
    }
  }, [
    tripId,
    category,
    query,
    enabled,
    reloadKey,
  ])

  return {
    widgets,
    loading,
    error,
    retry,
  }
}