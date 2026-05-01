// lib/utils/time.ts
// Single source of truth for time formatting across the app

/**
 * Converts a 24-hour time string "HH:MM" or "HH:MM:SS" to 12-hour format
 * e.g. "14:00" → "2:00 PM", "08:30" → "8:30 AM", "00:00" → "12:00 AM"
 */
export function formatTime(time: string): string {
  if (!time) return ""
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  const mins = m.toString().padStart(2, "0")
  return `${hour}:${mins} ${ampm}`
}

/**
 * Formats a duration in minutes to a readable string
 * e.g. 90 → "1 hr 30 min", 60 → "1 hr", 45 → "45 min"
 */
export function formatDuration(minutes: number): string {
  if (!minutes) return ""
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

/**
 * Formats a time range e.g. "8:30 AM – 10:00 AM"
 */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}