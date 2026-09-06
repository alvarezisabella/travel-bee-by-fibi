import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Widget, EventLabel } from "@/app/itinerary/types/types"
import { searchPlacesByText } from "@/lib/map/places"
import { searchGoogleHotels } from "@/lib/ai/serp"
import { searchTicketmaster } from "@/lib/ticketmaster"

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const RESULT_LIMIT = 12

// Transportation is still mock data, since it needs a different data source
// entirely.
const CATEGORY_TO_TYPE: Record<string, EventLabel> = {
  Dining: "Food",
  Stays: "Reservation",
  Activities: "Activity",
}

// Restricts results to one Places type so a search can't drift into hotels.
// Stays is absent because it uses SerpAPI rather than Places.
const CATEGORY_TO_PLACE_TYPE: Record<string, string> = {
  Dining: "restaurant",
  Activities: "tourist_attraction",
}

// Used when the user hasn't typed anything into the search box
const DEFAULT_QUERIES: Record<string, string> = {
  Dining: "restaurants",
  Stays: "hotels",
  Activities: "things to do",
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

// A nightly rate only means something for specific dates, so trips without
// them fall back to a short stay starting tomorrow
function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

// Parsed as UTC so a date only string never shifts a day either way
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().split("T")[0]
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
    .select("location, start_date, end_date")
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

  const checkIn = itinerary.start_date || addDays(1)
  let checkOut = itinerary.end_date || addDays(4)

  // SerpAPI rejects a check in date in the past, so say so plainly instead of
  // letting the request fail
  if (category === "Stays" && checkIn < addDays(0)) {
    return NextResponse.json(
      {
        error:
          "This trip's dates have already passed, so live hotel prices aren't available.",
      },
      { status: 400 }
    )
  }

  // SerpAPI needs check out strictly after check in, and some trips are saved
  // with both dates the same
  if (checkOut <= checkIn) {
    checkOut = nextDay(checkIn)
  }

  // Hotel rates are per booking, so the traveler count changes the quote
  let travelers = 2
  if (category === "Stays") {
    const { count } = await supabase
      .from("itinerary_members")
      .select("id", { count: "exact", head: true })
      .eq("itinerary_id", tripId)

    if (count) {
      travelers = count
    }
  }

  // Stays prices and Activities' Ticketmaster events depend on trip dates, so
  // both key the cache on them; Dining stays cached across date edits
  const dates =
    category === "Stays" || category === "Activities"
      ? `${checkIn}|${checkOut}`
      : ""

  const { data: cached } = await supabase
    .from("explore_cache")
    .select("results, created_at")
    .eq("itinerary_id", tripId)
    .eq("category", category)
    .eq("query", normalizedQuery)
    .eq("location", location)
    .eq("dates", dates)
    .maybeSingle()

  if (cached && Date.now() - new Date(cached.created_at).getTime() < CACHE_TTL_MS) {
    console.log("EXPLORE CACHE HIT:", category, normalizedQuery || "(default)", location)
    return NextResponse.json({ widgets: cached.results as Widget[] })
  }

  const searchQuery = normalizedQuery || DEFAULT_QUERIES[category] || category

  let widgets: Widget[]
  try {
    if (category === "Stays") {
      // Places returns no priceLevel for lodging, so hotels come from SerpAPI
      // which gives a real nightly rate for the trip's dates
      // normalizedQuery, not searchQuery: the latter falls back to the literal
      // string "hotels", which would build "hotels hotels in {location}"
      widgets = await searchGoogleHotels(
        location,
        checkIn,
        checkOut,
        travelers,
        0,
        RESULT_LIMIT,
        normalizedQuery || undefined
      )
    } else {
      // Naming the destination in the query is what keeps results in the right
      // city rather than matching the city name inside a business name
      const results = await searchPlacesByText(
        `${searchQuery} in ${location}`,
        CATEGORY_TO_PLACE_TYPE[category],
        RESULT_LIMIT
      )

      const placeWidgets: Widget[] = results.map((place) => ({
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

      if (category === "Activities") {
        // Ticketmaster covers ticketed events (concerts, games, shows) that
        // Places' tourist_attraction type never returns. It never throws, so
        // a Ticketmaster outage still leaves the Places results standing.
        const eventWidgets = await searchTicketmaster(normalizedQuery, location, 0, {
          startDate: checkIn,
          endDate: checkOut,
        })

        widgets = [...eventWidgets, ...placeWidgets].slice(0, RESULT_LIMIT)
      } else {
        widgets = placeWidgets
      }
    }
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
      dates,
      results: widgets,
      created_at: new Date().toISOString(),
    },
    { onConflict: "itinerary_id,category,query,location,dates" }
  )

  if (cacheError) {
    console.error("EXPLORE CACHE WRITE FAILED:", cacheError.message)
  }

  return NextResponse.json({ widgets })
}
