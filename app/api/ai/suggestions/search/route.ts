// app/api/ai/suggestions/search/route.ts

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Widget, EventLabel } from "@/app/itinerary/types/types"

const SERP_BASE = "https://serpapi.com/search.json"

async function searchYelp(
  query: string,
  location: string,
  type: EventLabel
): Promise<Widget | undefined> {
  const key = process.env.SERPAPI_KEY
  if (!key) return undefined

  const url =
    `${SERP_BASE}?engine=yelp` +
    `&find_desc=${encodeURIComponent(query)}` +
    `&find_loc=${encodeURIComponent(location)}` +
    `&api_key=${key}`

  console.log("YELP SEARCH URL:", url)

  const res = await fetch(url)
  if (!res.ok) {
    console.error("YELP SEARCH ERROR:", res.status)
    return undefined
  }

  const data = await res.json()
  const results: any[] = data.organic_results ?? []
  console.log("YELP RESULTS:", results.length, "for:", query)

  if (!results.length) return undefined

  const b = results[0]
  return {
    id: b.place_ids?.[0] ?? `${query}-${location}`.replace(/\s+/g, "-").toLowerCase(),
    title: b.name,
    location: b.neighborhoods?.[0] ?? b.address ?? location,
    description: b.categories?.map((c: any) => c.title).join(" · "),
    type,
    image_url: b.thumbnail || undefined,
    rating: b.rating,
    price: typeof b.price === "string" ? b.price.length : undefined,
  }
}

async function searchGoogleEvents(
  query: string,
  location: string,
  type: EventLabel
): Promise<Widget | undefined> {
  const key = process.env.SERPAPI_KEY
  if (!key) return undefined

  const url =
    `${SERP_BASE}?engine=google_events` +
    `&q=${encodeURIComponent(`${query} in ${location}`)}` +
    `&api_key=${key}`

  console.log("GOOGLE EVENTS SEARCH URL:", url)

  const res = await fetch(url)
  if (!res.ok) {
    console.error("GOOGLE EVENTS SEARCH ERROR:", res.status)
    return undefined
  }

  const data = await res.json()
  const results: any[] = data.events_results ?? []

  if (!results.length) return undefined

  const e = results[0]
  return {
    id: `${e.title}-${e.date?.start_date ?? ""}`.replace(/\s+/g, "-").toLowerCase(),
    title: e.title,
    location: Array.isArray(e.address) ? e.address[0] : e.address,
    description: e.date?.when ?? e.date?.start_date,
    type,
    image_url: e.thumbnail || undefined,
    rating: undefined,
    price: undefined,
  }
}

export async function POST(req: NextRequest) {
  console.log("SEARCH ROUTE HIT")

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { intents }: {
    intents: { query: string; type: EventLabel; location: string }[]
  } = await req.json()

  if (!intents?.length) {
    return NextResponse.json({ error: "intents are required." }, { status: 400 })
  }

  const widgets: Widget[] = []

  for (const intent of intents) {
    console.log("SEARCHING:", intent.query, intent.type, intent.location)
    try {
      let widget: Widget | undefined

      if (intent.type === "Reservation") {
        widget = await searchGoogleEvents(intent.query, intent.location, intent.type)
      } else {
        widget = await searchYelp(intent.query, intent.location, intent.type)
      }

      if (widget) {
        widgets.push(widget)
        console.log("FOUND:", widget.title)
      } else {
        console.log("NO RESULT for:", intent.query)
      }
    } catch (e) {
      console.error("SEARCH FAILED FOR:", intent.query, e)
    }
  }

  console.log("SEARCH DONE — intents:", intents.length, "widgets:", widgets.length)
  return NextResponse.json({ widgets })
}