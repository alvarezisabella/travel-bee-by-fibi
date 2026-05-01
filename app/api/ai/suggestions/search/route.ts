import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Widget, EventLabel } from "@/app/itinerary/types/types"

const TA_BASE = "https://api.content.tripadvisor.com/api/v1"
const TM_BASE = "https://app.ticketmaster.com/discovery/v2"

async function searchTripAdvisor(
  query: string,
  location: string,
  category: "restaurants" | "attractions",
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
    `&searchQuery=${encodeURIComponent(`${query} ${location}`)}` +
    `&category=${category}` +
    `&language=en`

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

function isGoodLocation(details: any): boolean {
  const description = (details.description ?? "").trim()
  if (description.length < 20) {
    console.log("FILTERED OUT (no description):", details.name)
    return false
  }

  if (!details.rating) {
    console.log("FILTERED OUT (no rating):", details.name)
    return false
  }

  const periods = details.hours?.periods
  if (periods?.length) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTime = now.getHours() * 100 + now.getMinutes()

    const todayHours = periods.find((p: any) => p.open?.day === dayOfWeek)
    if (todayHours) {
      const openTime = parseInt(todayHours.open?.time ?? "0000")
      const closeTime = parseInt(todayHours.close?.time ?? "2359")
      const isOpen = currentTime >= openTime && currentTime <= closeTime
      if (!isOpen) {
        console.log("FILTERED OUT (currently closed):", details.name)
        return false
      }
    }
  }

  return true
}

async function searchTripAdvisorWidgets(
  query: string,
  location: string,
  type: EventLabel,
  intentIndex: number
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

      if (!details) {
        console.log("SKIPPING (no details):", name)
        continue
      }

      if (!isGoodLocation(details)) continue

      if (!photoUrl) {
        console.log("FILTERED OUT (no photo):", name)
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
        description: details.description,
        type,
        image_url: photoUrl,
        rating: details.rating ? parseFloat(details.rating) : undefined,
        price: parsePriceLevel(details.price_level),
      })

      console.log(
        "TA WIDGET BUILT:", details.name,
        "| rating:", details.rating,
        "| photo:", photoUrl ? "yes" : "no"
      )
    } catch (e) {
      console.error("TA WIDGET FAILED FOR:", name, e)
    }
  }

  return widgets
}

function getBestTicketmasterImage(images: any[]): string | undefined {
  if (!images.length) return undefined

  // Prefer 16:9 ratio at largest width
  const sixteenNine = images
    .filter((img) => img.ratio === "16_9" && img.url)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))

  if (sixteenNine.length) return sixteenNine[0].url

  // Fall back to any image with a URL
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

  const url =
    `${TM_BASE}/events.json` +
    `?apikey=${key}` +
    `&keyword=${encodeURIComponent(query)}` +
    `&city=${encodeURIComponent(location)}` +
    `&size=5` +
    `&sort=relevance,desc`

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

    // Must have a venue and a date
    const venue = e._embedded?.venues?.[0]
    const date = e.dates?.start?.localDate
    if (!venue || !date) {
      console.log("FILTERED OUT (no venue or date):", e.name)
      continue
    }

    // Must have an image
    const image = getBestTicketmasterImage(e.images ?? [])
    if (!image) {
      console.log("FILTERED OUT (no image):", e.name)
      continue
    }

    // Min ticket price if available
    const priceRange = e.priceRanges?.[0]
    const price = priceRange ? Math.round(priceRange.min) : undefined

    // Build description from date + time + genre
    const startTime = e.dates?.start?.localTime
      ? e.dates.start.localTime.slice(0, 5)
      : ""
    const description = [
      date,
      startTime,
      e.classifications?.[0]?.segment?.name,
    ]
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
      url: e.url,
    })

    console.log(
      "TM WIDGET BUILT:", e.name,
      "| date:", date,
      "| image:", image
    )
  }

  return widgets
}

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

  const { intents }: {
    intents: { query: string; type: EventLabel; location: string }[]
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

      if (intent.type === "Reservation") {
        results = await searchTicketmaster(intent.query, intent.location, i)
      } else {
        results = await searchTripAdvisorWidgets(
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

  // If no widgets found at all, ask Claude for a fallback message
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

    // Hard fallback if Claude call also fails
    return NextResponse.json({
      widgets: [],
      fallback:
        "No results were found for your search. Try searching for a different event type or a nearby major city.",
    })
  }

  console.log("SEARCH DONE — intents:", intents.length, "widgets:", widgets.length)
  return NextResponse.json({ widgets })
}