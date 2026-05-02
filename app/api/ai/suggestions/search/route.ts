import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Widget, EventLabel } from "@/app/itinerary/types/types"
import {
  searchGoogleFlights,
  searchGoogleHotels,
} from "@/lib/ai/serp"

const TA_BASE = "https://api.content.tripadvisor.com/api/v1"
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

// ─── TRIPADVISOR HELPERS ─────────────────────────────────────────────────────

async function searchTripAdvisor(
  query: string,
  location: string,
  category: "restaurants" | "attractions" | "hotels",
  limit: number = 5
): Promise<{ locationId: string; name: string }[]> {
  const key = process.env.TRIPADVISOR_KEY
  if (!key) {
    console.error("TRIPADVISOR_KEY not set")
    return []
  }

  const url =
    `${TA_BASE}/location/search` +
    `?key=${key}` +
    `&searchQuery=${encodeURIComponent(query)}` +
    `&category=${category}` +
    `&language=en` +
    `&address=${encodeURIComponent(location)}`

  console.log("TA SEARCH URL:", url)

  const res = await fetch(url)
  if (!res.ok) {
    console.error("TA SEARCH ERROR:", res.status, await res.text())
    return []
  }

  const data = await res.json()
  console.log("TA SEARCH RESULTS:", data.data?.length, "for:", query)
  console.log("TA SEARCH FIRST:", JSON.stringify(data.data?.[0], null, 2))

  return (data.data ?? []).slice(0, limit).map((loc: any) => ({
    locationId: loc.location_id,
    name: loc.name,
  }))
}

async function getLocationDetails(locationId: string): Promise<any> {
  const key = process.env.TRIPADVISOR_KEY
  if (!key) return null

  const url =
    `${TA_BASE}/location/${locationId}/details` +
    `?key=${key}` +
    `&language=en` +
    `&currency=USD`

  console.log("TA DETAILS URL:", url)

  const res = await fetch(url)
  if (!res.ok) {
    console.error("TA DETAILS ERROR:", res.status)
    return null
  }

  const data = await res.json()
  console.log("TA DETAILS:", JSON.stringify(data, null, 2))
  return data
}

async function getLocationPhoto(locationId: string): Promise<string | undefined> {
  const key = process.env.TRIPADVISOR_KEY
  if (!key) return undefined

  const url =
    `${TA_BASE}/location/${locationId}/photos` +
    `?key=${key}` +
    `&language=en` +
    `&limit=1` +
    `&source=Traveler`

  console.log("TA PHOTOS URL:", url)

  const res = await fetch(url)
  if (!res.ok) {
    console.error("TA PHOTOS ERROR:", res.status)
    return undefined
  }

  const data = await res.json()
  const photo = data.data?.[0]
  console.log("TA PHOTO:", JSON.stringify(photo, null, 2))

  return photo?.images?.large?.url ?? photo?.images?.original?.url ?? undefined
}

function parsePriceLevel(priceLevel: string | undefined): number | undefined {
  if (!priceLevel) return undefined
  return priceLevel.replace(/[^$]/g, "").length || undefined
}

// Relaxed for Food — no description required, no hours check
function isGoodLocation(details: any, type?: EventLabel): boolean {
  const description = (details.description ?? "").trim()

  if (type !== "Food" && description.length < 20) {
    console.log("FILTERED OUT (no description):", details.name)
    return false
  }

  if (!details.rating) {
    console.log("FILTERED OUT (no rating):", details.name)
    return false
  }

  return true
}

function isRelevantResult(details: any, query: string): boolean {
  const queryWords = query.toLowerCase().split(" ").filter((w) => w.length > 3)

  const name = details.name?.toLowerCase() ?? ""
  const cuisine = details.cuisine?.map((c: any) => c.name.toLowerCase()).join(" ") ?? ""
  const subcategory = details.subcategory?.map((s: any) => s.name.toLowerCase()).join(" ") ?? ""
  const description = (details.description ?? "").toLowerCase()

  const searchableText = `${name} ${cuisine} ${subcategory} ${description}`
  const hasMatch = queryWords.some((word) => searchableText.includes(word))

  if (!hasMatch) {
    console.log("RELEVANCE FILTERED:", details.name, "— query:", query)
    return false
  }

  return true
}

// ─── TRIPADVISOR RESTAURANTS + ATTRACTIONS ───────────────────────────────────

async function searchTripAdvisorWidgets(
  query: string,
  location: string,
  type: EventLabel,
  intentIndex: number,
  intentQuery: string
): Promise<Widget[]> {
  const category = type === "Food" ? "restaurants" : "attractions"
  const locations = await searchTripAdvisor(query, location, category, 5)
  if (!locations.length) return []

  const widgets: Widget[] = []

  for (let i = 0; i < locations.length; i++) {
    if (widgets.length >= 3) break

    const { locationId, name } = locations[i]
    try {
      const [details, photoUrl] = await Promise.all([
        getLocationDetails(locationId),
        getLocationPhoto(locationId),
      ])

      console.log("TA DETAILS FOR:", name, {
        hasDetails: !!details,
        description: details?.description?.slice(0, 50),
        rating: details?.rating,
        hasPhoto: !!photoUrl,
      })

      if (!details) {
        console.log("SKIP (no details):", name)
        continue
      }

      if (!isGoodLocation(details, type)) continue
      if (!isRelevantResult(details, intentQuery)) continue

      if (!photoUrl) {
        console.log("SKIP (no photo):", name)
        continue
      }

      widgets.push({
        id: `${locationId}-${intentIndex}-${i}`,
        title: details.name ?? name,
        location: details.address_obj
          ? [details.address_obj.street1, details.address_obj.city]
              .filter(Boolean)
              .join(", ")
          : location,
        description: details.description?.trim().length > 0
          ? details.description
          : details.cuisine?.[0]?.localized_name ?? undefined,
        type,
        image_url: photoUrl,
        rating: details.rating ? parseFloat(details.rating) : undefined,
        price: parsePriceLevel(details.price_level),
        url: details.web_url ?? undefined,
      })

      console.log("TA WIDGET BUILT:", details.name, "| rating:", details.rating)
    } catch (e) {
      console.error("TA WIDGET FAILED FOR:", name, e)
    }
  }

  return widgets
}

// ─── TRIPADVISOR HOTELS ──────────────────────────────────────────────────────

async function searchTripAdvisorHotels(
  query: string,
  location: string,
  intentIndex: number
): Promise<Widget[]> {
  const locations = await searchTripAdvisor(query, location, "hotels", 5)
  if (!locations.length) return []

  const widgets: Widget[] = []

  for (let i = 0; i < locations.length; i++) {
    if (widgets.length >= 3) break

    const { locationId, name } = locations[i]
    try {
      const [details, photoUrl] = await Promise.all([
        getLocationDetails(locationId),
        getLocationPhoto(locationId),
      ])

      if (!details) continue
      if (!details.rating) continue
      if (!photoUrl) continue

      widgets.push({
        id: `${locationId}-${intentIndex}-${i}`,
        title: details.name ?? name,
        location: details.address_obj
          ? [details.address_obj.street1, details.address_obj.city]
              .filter(Boolean)
              .join(", ")
          : location,
        description: details.description?.trim().length > 20
          ? details.description
          : details.subcategory?.[0]?.localized_name ?? "Hotel",
        type: "Reservation",
        image_url: photoUrl,
        rating: details.rating ? parseFloat(details.rating) : undefined,
        price: parsePriceLevel(details.price_level),
        url: details.web_url ?? undefined,
      })

      console.log("TA HOTEL BUILT:", details.name, "| url:", details.web_url ? "yes" : "no")
    } catch (e) {
      console.error("TA HOTEL FAILED FOR:", name, e)
    }
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

async function searchTicketmaster(
  query: string,
  location: string,
  intentIndex: number
): Promise<Widget[]> {
  const key = process.env.TICKETMASTER_KEY
  if (!key) {
    console.error("TICKETMASTER_KEY not set")
    return []
  }

  // Clean up query — strip filler words, expand acronyms
  const cleanQuery = query
    .replace(/\b(game|games|match|event|show|ticket|live)\b/gi, "")
    .replace(/\bMLB\b/gi, "baseball")
    .replace(/\bNBA\b/gi, "basketball")
    .replace(/\bNFL\b/gi, "football")
    .replace(/\bNHL\b/gi, "hockey")
    .trim()

  // Extract city and state code from location
  const cityMatch = location.match(/^([^,]+)/)
  const city = cityMatch?.[1]?.trim() ?? location
  const stateMatch = location.match(/,\s*([A-Z]{2})/)
  const stateCode = stateMatch?.[1] ?? ""

  const params = new URLSearchParams({
    apikey: key,
    keyword: cleanQuery,
    size: "5",
    sort: "date,asc",
  })

  if (stateCode) {
    params.set("stateCode", stateCode)
    params.set("countryCode", "US")
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
  console.log("TM RAW RESPONSE:", JSON.stringify(data, null, 2))
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
        // Extract IATA codes from query first — Claude outputs these reliably
        // e.g. "flight SNA to JFK" → origin: "SNA", dest: "JFK"
        const queryIataMatch = intent.query.match(/\b([A-Z]{3})\b.*?\b([A-Z]{3})\b/)

        let originLoc: string
        let destLoc: string

        if (queryIataMatch) {
          // Use IATA codes directly from the query — most reliable
          originLoc = queryIataMatch[1]
          destLoc = queryIataMatch[2]
          console.log("IATA FROM QUERY:", originLoc, "→", destLoc)
        } else {
          // Fall back to splitting location string
          const locationParts = intent.location.split(/\s+to\s+/i)
          originLoc = locationParts[0]?.trim() ?? intent.location
          destLoc = locationParts[1]?.trim() ?? intent.location
          console.log("IATA FROM LOCATION:", originLoc, "→", destLoc)
        }

        const depDate = intent.departureDate ?? getCheckinDate(trip)
        const adults = trip?.travelers?.length ?? 1

        results = await searchGoogleFlights(originLoc, destLoc, depDate, adults, i)
        console.log("FLIGHT RESULTS:", results.length)
      }

        // Car rental fallback — Google Maps deep link for now
        // Replace with Booking.com cars if you have that key
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
        const isFood = /restaurant|food|eat|dining|burger|cafe|bar|coffee|brunch|lunch|dinner|breakfast/i.test(intent.query)

        if (isHotel) {
          // 1. Try Google Hotels first
          const checkIn = getCheckinDate(trip)
          const checkOut = getCheckoutDate(trip)
          const adults = trip?.travelers?.length ?? 2
          results = await searchGoogleHotels(intent.location, checkIn, checkOut, adults, i)

          // 2. Fall back to TripAdvisor hotels
          if (!results.length) {
            results = await searchTripAdvisorHotels(intent.query, intent.location, i)
          }
        } else {
          // 1. Try Ticketmaster for concerts/events/sports
          results = await searchTicketmaster(intent.query, intent.location, i)

          // 2. Fall back to TripAdvisor food/activity if Claude misclassified
          if (!results.length) {
            results = await searchTripAdvisorWidgets(
              intent.query,
              intent.location,
              isFood ? "Food" : "Activity",
              i,
              intent.query
            )
          }
        }

      } else {
        // Food and Activity — TripAdvisor
        results = await searchTripAdvisorWidgets(
          intent.query,
          intent.location,
          intent.type,
          i,
          intent.query
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

  console.log("SEARCH DONE — intents:", intents.length, "widgets:", widgets.length)
  return NextResponse.json({ widgets })
}