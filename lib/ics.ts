import { Trip } from "@/app/itinerary/types/trips"

function formatICSDate(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM → YYYYMMDDTHHMMSS (local/floating)
  return `${date.replace(/-/g, "")}T${time.replace(/:/g, "").slice(0, 4)}00`
}

function addMinutes(date: string, time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  const newTime = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
  return formatICSDate(date, newTime)
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

export function generateICS(trip: Trip): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Travel Bee//Travel Bee//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  for (const day of trip.days) {
    if (!day.date) continue
    for (const event of day.events) {
      const start = event.startTime || "09:00"
      const dtstart = formatICSDate(day.date, start)
      const dtend = addMinutes(day.date, start, event.duration || 60)

      lines.push("BEGIN:VEVENT")
      lines.push(`DTSTART:${dtstart}`)
      lines.push(`DTEND:${dtend}`)
      lines.push(`SUMMARY:${escapeICS(event.title)}`)
      if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`)
      if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
      lines.push(`UID:${event.id}@travelbee`)
      lines.push("END:VEVENT")
    }
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export function downloadICS(trip: Trip): void {
  console.log("[ICS] trip.days:", trip.days)
  const ics = generateICS(trip)
  console.log("[ICS] generated:", ics)
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${trip.title.replace(/[^a-z0-9]/gi, "_")}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
