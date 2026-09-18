import type { Widget } from "@/app/itinerary/types/types"

const STORAGE_PREFIX = "travelbee-explore-selection"

function storageKey(tripId: string, widgetId: string) {
  return `${STORAGE_PREFIX}:${tripId}:${widgetId}`
}

function currentStorageKey(tripId: string) {
  return `${STORAGE_PREFIX}:current:${tripId}`
}

function readSelection(key: string): Widget | null {
  if (typeof window === "undefined") return null

  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return null

    const parsed: unknown = JSON.parse(stored)

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("id" in parsed) ||
      typeof parsed.id !== "string" ||
      !("title" in parsed) ||
      typeof parsed.title !== "string"
    ) {
      return null
    }

    return parsed as Widget
  } catch (error) {
    console.error("Could not read Explore selection:", error)
    return null
  }
}

export function saveExploreSelection(
  tripId: string,
  widget: Widget,
): boolean {
  if (typeof window === "undefined") return false

  try {
    const serialized = JSON.stringify(widget)

    window.localStorage.setItem(
      storageKey(tripId, widget.id),
      serialized,
    )

    window.localStorage.setItem(
      currentStorageKey(tripId),
      serialized,
    )

    return true
  } catch (error) {
    console.error("Could not save Explore selection:", error)
    return false
  }
}

export function getCurrentExploreSelection(
  tripId: string,
): Widget | null {
  return readSelection(currentStorageKey(tripId))
}

export function getExploreSelection(
  tripId: string,
  widgetId: string,
): Widget | null {
  if (!tripId || !widgetId) return null

  const widget = readSelection(storageKey(tripId, widgetId))

  return widget?.id === widgetId ? widget : null
}