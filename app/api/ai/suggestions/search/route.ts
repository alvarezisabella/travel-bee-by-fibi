import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Widget, EventLabel } from "@/app/itinerary/types/types"
import {
  searchGoogleFlights,
  searchGoogleHotels,
} from "@/lib/ai/serp"

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

// ─── SERP TRIPADVISOR ─────────────────────────────────────────────────────────

function simplifyQuery(query: string): string {
  return query
    .replace(/\b(specialty|artisan|independent|authentic|traditional|modern|trendy|popular|best|top|local|hidden|unique|cozy|upscale|casual|third wave)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

async function searchSerpTripAdvisor(
  query: string,
  location: string,
  type: EventLabel,
  intentIndex: number
): Promise<Widget[]> {
  const key = process.env.SERPAPI_KEY
  if (!key) {
    console.error("SERPAPI_KEY not set")
    return []
  }

  const simplified = simplifyQuery(query)
  console.log("SERP TA QUERY:", query, "→ simplified:", simplified)

  const params = new URLSearchParams({
    engine: "tripadvisor",
    q: `${simplified || query} ${location}`,
    api_key: key,
  })

  const url = `https://serpapi.com/search?${params.toString()}`
  console.log("SERP TA URL:", url)

  const res = await fetch(url)
  if (!res.ok) {
    console.error("SERP TA ERROR:", res.status, await res.text())
    return []
  }

  const data = await res.json()

  const places: any[] = data.places ?? []
  console.log("SERP TA PLACES:", places.length)

  const widgets: Widget[] = []
  const seenTitles = new Set<string>()

  for (let i = 0; i < places.length; i++) {
    if (widgets.length >= 3) break
    const place = places[i]

    const title = place.title ?? place.name
    if (!title || seenTitles.has(title.toLowerCase())) {
      console.log("SERP TA SKIP (duplicate):", title)
      continue
    }

    const photoUrl =
      place.thumbnail ??
      place.photo?.images?.large?.url ??
      place.images?.[0]?.url

    if (!photoUrl) {
      console.log("SERP TA SKIP (no photo):", title)
      continue
    }

    if (!place.rating) {
      console.log("SERP TA SKIP (no rating):", title)
      continue
    }

    widgets.push({
      id: `serp-ta-${place.location_id ?? place.place_id ?? i}-${intentIndex}`,
      title,
      location: place.address ?? place.address_string ?? location,
      description:
        place.description ??
        place.snippet ??
        place.type ??
        undefined,
      type,
      image_url: photoUrl,
      rating: typeof place.rating === "number" ? place.rating : parseFloat(place.rating),
      price: place.price_range
        ? place.price_range.replace(/[^$]/g, "").length
        : undefined,
      url: place.link ?? place.web_url ?? undefined,
    })

    seenTitles.add(title.toLowerCase())
    console.log("SERP TA WIDGET BUILT:", title, "| rating:", place.rating)
  }

  return widgets
}

// ─── TICKETMASTER ────────────────────────────────────────────────────────────

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

// City name to IATA fallback
const cityToIata: Record<string, string> = {
  london: "LHR", "new york": "JFK", "los angeles": "LAX",
  "san francisco": "SFO", chicago: "ORD", miami: "MIA",
  paris: "CDG", tokyo: "NRT", sydney: "SYD", dubai: "DXB",
  amsterdam: "AMS", frankfurt: "FRA", toronto: "YYZ",
  singapore: "SIN", bangkok: "BKK", barcelona: "BCN",
  rome: "FCO", madrid: "MAD", berlin: "BER", seoul: "ICN",
  "hong kong": "HKG", istanbul: "IST", dublin: "DUB",
  "mexico city": "MEX", "sao paulo": "GRU", cairo: "CAI",
}

async function searchTicketmaster(
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
      id: `${e.id}-${intentIndex}-${i}`,
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

// ─── ROUTE HANDLER ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("SEARCH ROUTE HIT")

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await req.json()
  console.log("SEARCH BODY:", JSON.stringify(body, null, 2))

  const { intents, trip }: {
    intents: { query: string; type: EventLabel; location: string; departureDate?: string }[]
    trip?: any
  } = body

  if (!intents?.length) {
    return NextResponse.json({ error: "intents are required." }, { status: 400 })
  }

  const widgets: Widget[] = []

  for (let i = 0; i < intents.length; i++) {
    const intent = intents[i]
    console.log("PROCESSING INTENT:", intent.query, intent.type, intent.location)

    try {
      let results: Widget[] = []

      if (intent.type === "Transit") {
        const isFlight = /flight|fly|airline|airport|depart|arrive/i.test(intent.query)
        const isCar = /car|rental|drive|vehicle|rent/i.test(intent.query)

        if (isFlight) {
          const queryIataMatch = intent.query.match(/\b([A-Z]{3})\b.*?\b([A-Z]{3})\b/)

          let originLoc: string
          let destLoc: string

          if (queryIataMatch) {
            originLoc = queryIataMatch[1]
            destLoc = queryIataMatch[2]
            console.log("IATA FROM QUERY:", originLoc, "→", destLoc)
          } else {
            const locationParts = intent.location.split(/\s+to\s+/i)
            const originRaw = locationParts[0]?.trim().toLowerCase() ?? ""
            const destRaw = locationParts[1]?.trim().toLowerCase() ?? ""
            originLoc = cityToIata[originRaw] ?? locationParts[0]?.trim() ?? intent.location
            destLoc = cityToIata[destRaw] ?? locationParts[1]?.trim() ?? intent.location
            console.log("IATA FROM LOCATION:", originLoc, "→", destLoc)
          }

          const depDate = intent.departureDate ?? getCheckinDate(trip)
          const adults = trip?.travelers?.length ?? 1

          results = await searchGoogleFlights(originLoc, destLoc, depDate, adults, i)
          console.log("FLIGHT RESULTS:", results.length)
        }

        // Car rental / transit fallback
        if (!results.length) {
          results = [{
            id: `transit-${i}`,
            title: intent.query,
            location: intent.location,
            description: isCar
              ? `Find car rentals in ${intent.location}`
              : `Get directions to ${intent.location}`,
            type: "Transit",
            image_url: undefined,
            rating: undefined,
            price: undefined,
            url: isCar
              ? `https://www.google.com/travel/explore?dest=${encodeURIComponent(intent.location)}&traveltype=car`
              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(intent.location)}&travelmode=transit`,
          }]
        }

      } else if (intent.type === "Reservation") {
        const isHotel = /hotel|stay|accommodation|hostel|resort|inn|lodge/i.test(intent.query)

        if (isHotel) {
          const checkIn = getCheckinDate(trip)
          const checkOut = getCheckoutDate(trip)
          const adults = trip?.travelers?.length ?? 2
          results = await searchGoogleHotels(intent.location, checkIn, checkOut, adults, i)
        } else {
          // Ticketmaster for concerts/events/sports
          results = await searchTicketmaster(intent.query, intent.location, i, trip)
        }

      } else {
        // Food and Activity — SerpAPI TripAdvisor
        results = await searchSerpTripAdvisor(
          intent.query,
          intent.location,
          intent.type,
          i
        )
      }

      if (!results.length) {
        console.log("NO RESULTS for:", intent.query)
        continue
      }

      widgets.push(...results)
      console.log("ADDED:", results.length, "widgets for:", intent.query)
    } catch (e) {
      console.error("INTENT FAILED:", intent.query, e)
    }
  }

  // No widgets at all — ask Claude for a fallback message
  if (!widgets.length) {
    console.log("NO WIDGETS FOUND — generating fallback message")

    try {
      const fallbackRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system:
            "You are a helpful travel assistant. Keep responses to 2-3 sentences, plain text only, no markdown, no bullet points, no emojis.",
          messages: [
            {
              role: "user",
              content:
                `No results were found for: ${intents
                  .map((i) => `"${i.query}" in ${i.location}`)
                  .join(", ")}. ` +
                `Write a short friendly message telling the user no results were found and suggest they try different dates, a nearby major city, or a different type of event or activity.`,
            },
          ],
        }),
      })

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json()
        const fallback =
          fallbackData.content?.[0]?.text ??
          "No results were found for your search. Try adjusting your dates or searching for a different type of event."
        console.log("FALLBACK MESSAGE:", fallback)
        return NextResponse.json({ widgets: [], fallback })
      }
    } catch (e) {
      console.error("FALLBACK GENERATION FAILED:", e)
    }

    return NextResponse.json({
      widgets: [],
      fallback: "No results were found for your search. Try searching for a different event type or a nearby major city.",
    })
  }

  // Dedupe across all intents by title
  const seen = new Set<string>()
  const deduped = widgets.filter(w => {
    const key = w.title?.toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log("SEARCH DONE — intents:", intents.length, "widgets:", widgets.length, "deduped:", deduped.length)
  return NextResponse.json({ widgets: deduped })
}