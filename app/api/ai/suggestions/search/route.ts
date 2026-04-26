// app/api/ai/suggestions/search/route.ts

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Widget, EventLabel } from "@/app/itinerary/types/types"

const TA_BASE = "https://api.content.tripadvisor.com/api/v1"

// Step 1 — search for locations by query + category
async function searchTripAdvisor(
  query: string,
  location: string,
  category: "restaurants" | "attractions",
  intentIndex: number,
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

// Step 2 — get full details for a location (rating, price, address, description, hours)
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

// Step 3 — get the best available photo for a location
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

  // Prefer large, fall back to original
  return photo?.images?.large?.url ?? photo?.images?.original?.url ?? undefined
}

// Maps TripAdvisor price level string to a number
function parsePriceLevel(priceLevel: string | undefined): number | undefined {
  if (!priceLevel) return undefined
  return priceLevel.replace(/[^$]/g, "").length || undefined
}

// Quality filter — only return places that are open, described, and rated
function isGoodLocation(details: any): boolean {
  // Must have a meaningful description
  const description = (details.description ?? "").trim()
  if (description.length < 20) {
    console.log("FILTERED OUT (no description):", details.name)
    return false
  }

  // Must have a rating
  if (!details.rating) {
    console.log("FILTERED OUT (no rating):", details.name)
    return false
  }

  // Check if currently open using hours data if available
  const periods = details.hours?.periods
  if (periods?.length) {
    const now = new Date()
    const dayOfWeek = now.getDay()           // 0 = Sunday
    const currentTime = now.getHours() * 100 + now.getMinutes() // e.g. 1430

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

// Full pipeline: search → filter → details + photo → Widget[]
async function searchTripAdvisorWidgets(
  query: string,
  location: string,
  type: EventLabel,
  intentIndex: number
): Promise<Widget[]> {
  const category = type === "Food" ? "restaurants" : "attractions"

  // Fetch 5 candidates so we have backups after filtering
  const locations = await searchTripAdvisor(query, location, category, intentIndex, 5)
  if (!locations.length) return []

  const widgets: Widget[] = []

  for (let i = 0; i < locations.length; i++) {
    // Stop once we have 3 good widgets per intent
    if (widgets.length >= 3) break

    const { locationId, name } = locations[i]
    try {
      // Fetch details and photo in parallel
      const [details, photoUrl] = await Promise.all([
        getLocationDetails(locationId),
        getLocationPhoto(locationId),
      ])

      if (!details) {
        console.log("SKIPPING (no details):", name)
        continue
      }

      // Apply quality filters
      if (!isGoodLocation(details)) continue

      // Require a photo
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

      console.log("TA WIDGET BUILT:", details.name, "| rating:", details.rating, "| photo:", photoUrl ? "yes" : "no")
    } catch (e) {
      console.error("TA WIDGET FAILED FOR:", name, e)
    }
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
      const results = await searchTripAdvisorWidgets(
        intent.query,
        intent.location,
        intent.type,
        i
      )

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

  console.log("SEARCH DONE — intents:", intents.length, "widgets:", widgets.length)
  return NextResponse.json({ widgets })
}