import { Widget } from "@/app/itinerary/types/types"

const TM_BASE = "https://app.ticketmaster.com/discovery/v2"

// ─── DATE HELPERS ────────────────────────────────────────────────────────────

function getCheckinDate(trip?: any): string {
  if (trip?.startDate) return trip.startDate
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split("T")[0]
}

function getCheckoutDate(trip?: any): string {
  if (trip?.endDate) return trip.endDate
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().split("T")[0]
}

function getBestTicketmasterImage(images: any[]): string | undefined {
  if (!images.length) return undefined
  const sixteenNine = images
    .filter((img) => img.ratio === "16_9" && img.url)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  if (sixteenNine.length) return sixteenNine[0].url
  return images.find((img) => img.url)?.url
}

// Country code map for common non-US cities
const countryMap: Record<string, string> = {
  london: "GB", manchester: "GB", birmingham: "GB", glasgow: "GB",
  edinburgh: "GB", bristol: "GB", leeds: "GB", liverpool: "GB",
  paris: "FR", berlin: "DE", munich: "DE", hamburg: "DE",
  amsterdam: "NL", toronto: "CA", vancouver: "CA", montreal: "CA",
  sydney: "AU", melbourne: "AU", brisbane: "AU",
  tokyo: "JP", osaka: "JP", dublin: "IE", madrid: "ES",
  barcelona: "ES", rome: "IT", milan: "IT",
}

export async function searchTicketmaster(
  query: string,
  location: string,
  intentIndex: number,
  trip?: any
): Promise<Widget[]> {
  const key = process.env.TICKETMASTER_KEY
  if (!key) {
    console.error("TICKETMASTER_KEY not set")
    return []
  }

  const cleanQuery = query
    .replace(/\b(concert|show|game|match|ticket|live|event|music|tour)\b/gi, "")
    .replace(/\bMLB\b/gi, "baseball")
    .replace(/\bNBA\b/gi, "basketball")
    .replace(/\bNFL\b/gi, "football")
    .replace(/\bNHL\b/gi, "hockey")
    .replace(/\s+/g, " ")
    .trim()

  const city = location.split(",")[0]?.trim() ?? location
  const stateMatch = location.match(/,\s*([A-Z]{2})$/)
  const stateCode = stateMatch?.[1] ?? ""
  const countryCode =
    countryMap[city.toLowerCase()] ?? (stateCode ? "US" : undefined)

  const startDate = trip?.startDate ?? getCheckinDate(trip)
  const endDate = trip?.endDate ?? getCheckoutDate(trip)
  const startDateTime = `${startDate}T00:00:00Z`
  const endDateTime = `${endDate}T23:59:59Z`

  const params = new URLSearchParams({
    apikey: key,
    keyword: cleanQuery || query,
    size: "5",
    sort: "date,asc",
    startDateTime,
    endDateTime,
  })

  if (stateCode) {
    params.set("stateCode", stateCode)
    params.set("countryCode", "US")
  } else if (countryCode) {
    params.set("city", city)
    params.set("countryCode", countryCode)
  } else {
    params.set("city", city)
  }

  const url = `${TM_BASE}/events.json?${params.toString()}`
  console.log("TM SEARCH URL:", url)

  const res = await fetch(url)
  if (!res.ok) {
    console.error("TM SEARCH ERROR:", res.status, await res.text())
    return []
  }

  const data = await res.json()
  const events = data._embedded?.events ?? []
  console.log("TM EVENTS FOUND:", events.length)

  const widgets: Widget[] = []

  for (let i = 0; i < events.length; i++) {
    if (widgets.length >= 3) break

    const e = events[i]
    const venue = e._embedded?.venues?.[0]
    const date = e.dates?.start?.localDate
    if (!venue || !date) {
      console.log("FILTERED OUT (no venue or date):", e.name)
      continue
    }

    const image = getBestTicketmasterImage(e.images ?? [])
    if (!image) {
      console.log("FILTERED OUT (no image):", e.name)
      continue
    }

    const priceRange = e.priceRanges?.[0]
    const price = priceRange ? Math.round(priceRange.min) : undefined

    const startTime = e.dates?.start?.localTime
      ? e.dates.start.localTime.slice(0, 5)
      : ""
    const description = [date, startTime, e.classifications?.[0]?.segment?.name]
      .filter(Boolean)
      .join(" · ")

    widgets.push({
      // tm- prefix lets callers that mix sources (e.g. the Explore page) tell
      // this apart from Places widgets, whose price is a 0-4 tier rather than
      // a real dollar figure.
      id: `tm-${e.id}-${intentIndex}-${i}`,
      title: e.name,
      location: [venue.name, venue.city?.name].filter(Boolean).join(", "),
      description,
      type: "Reservation",
      image_url: image,
      rating: undefined,
      price,
      url: e.url ?? undefined,
    })

    console.log("TM WIDGET BUILT:", e.name, "| date:", date)
  }

  return widgets
}
