import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Widget, EventLabel } from "@/app/itinerary/types/types"
import { searchPlacesByText } from "@/lib/map/places"

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const RESULT_LIMIT = 12

// Only Dining is wired up so far. Stays and Activities get added here as their
// own mini tasks land; Transportation needs a different data source entirely.
const CATEGORY_TO_TYPE: Record<string, EventLabel> = {
  Dining: "Food",
}

// Restricts results to one Places type so a search can't drift into hotels
const CATEGORY_TO_PLACE_TYPE: Record<string, string> = {
  Dining: "restaurant",
}

// Used when the user hasn't typed anything into the search box
const DEFAULT_QUERIES: Record<string, string> = {
  Dining: "restaurants",
}

// Widget.price is a number, so the Places enum is stored as a 0 to 4 tier and
// rendered as dollar signs on the card
const PRICE_LEVEL_TO_TIER: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { tripId, category, query } = await req.json()

  if (!tripId || !category) {
    return NextResponse.json(
      { error: "tripId and category are required." },
      { status: 400 }
    )
  }

  const type = CATEGORY_TO_TYPE[category]
  if (!type) {
    return NextResponse.json(
      { error: `Category "${category}" is not supported yet.` },
      { status: 400 }
    )
  }

  // Read the destination server side rather than trusting the client
  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .select("location")
    .eq("id", tripId)
    .single()

  if (itineraryError || !itinerary) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 })
  }

  const location = itinerary.location?.trim()
  if (!location) {
    return NextResponse.json(
      { error: "This trip doesn't have a destination yet. Add one to see recommendations." },
      { status: 400 }
    )
  }

  const normalizedQuery = (query ?? "").trim()

  const { data: cached } = await supabase
    .from("explore_cache")
    .select("results, created_at")
    .eq("itinerary_id", tripId)
    .eq("category", category)
    .eq("query", normalizedQuery)
    .eq("location", location)
    .maybeSingle()

  if (cached && Date.now() - new Date(cached.created_at).getTime() < CACHE_TTL_MS) {
    console.log("EXPLORE CACHE HIT:", category, normalizedQuery || "(default)", location)
    return NextResponse.json({ widgets: cached.results as Widget[] })
  }

  const searchQuery = normalizedQuery || DEFAULT_QUERIES[category] || category

  let widgets: Widget[]
  try {
    // Naming the destination in the query is what keeps results in the right
    // city rather than matching the city name inside a business name
    const results = await searchPlacesByText(
      `${searchQuery} in ${location}`,
      CATEGORY_TO_PLACE_TYPE[category],
      RESULT_LIMIT
    )

    widgets = results.map((place) => ({
      id: `gplace-${place.id}`,
      title: place.title,
      location: place.address,
      // The editorial summary is better prose but long enough to push the
      // address off the card, and the address matters more when planning
      description: place.category ?? place.summary,
      type,
      image_url: place.photoName
        ? `/api/places/photo?name=${encodeURIComponent(place.photoName)}`
        : undefined,
      rating: place.rating,
      price:
        place.priceLevel !== undefined
          ? PRICE_LEVEL_TO_TIER[place.priceLevel]
          : undefined,
      url: place.websiteUri,
    }))
  } catch (e) {
    console.error("EXPLORE SEARCH FAILED:", e)
    return NextResponse.json(
      { error: "We couldn't load recommendations right now." },
      { status: 502 }
    )
  }

  // created_at is set explicitly so a refreshed entry resets its TTL
  const { error: cacheError } = await supabase.from("explore_cache").upsert(
    {
      itinerary_id: tripId,
      category,
      query: normalizedQuery,
      location,
      results: widgets,
      created_at: new Date().toISOString(),
    },
    { onConflict: "itinerary_id,category,query,location" }
  )

  if (cacheError) {
    console.error("EXPLORE CACHE WRITE FAILED:", cacheError.message)
  }

  return NextResponse.json({ widgets })
}
