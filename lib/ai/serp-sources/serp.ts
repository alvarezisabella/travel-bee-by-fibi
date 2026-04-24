// lib/ai/sources/serp.ts

import { Widget, EventLabel } from "@/app/itinerary/types/types"

// Yelp Place via SerpAPI — for Food and Reservation types
export async function fetchYelpWidgets(
  query: string,
  location: string,
  type: EventLabel
): Promise<Widget[]> {
  const url =
    `https://serpapi.com/search?engine=yelp_place` +
    `&find_desc=${encodeURIComponent(query)}` +
    `&find_loc=${encodeURIComponent(location)}` +
    `&api_key=${process.env.SERPAPI_KEY}`

  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()

  return (data.organic_results ?? []).slice(0, 3).map((b: any): Widget => ({
    id: b.place_ids?.[0] ?? b.title?.replace(/\s+/g, "-").toLowerCase(),
    title: b.title,
    location: b.neighborhoods?.[0] ?? b.address,
    description: b.categories?.map((c: any) => c.title).join(" · "),
    type,
    image_url: b.thumbnail || undefined,
    rating: b.rating,
    price: b.price?.length ?? undefined,  // "$$$" → 3
  }))
}

// Google Events via SerpAPI — for Activity and Transit types
export async function fetchGoogleEventsWidgets(
  query: string,
  location: string,
  type: EventLabel
): Promise<Widget[]> {
  const url =
    `https://serpapi.com/search?engine=google_events` +
    `&q=${encodeURIComponent(query + " " + location)}` +
    `&api_key=${process.env.SERPAPI_KEY}`

  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()

  return (data.events_results ?? []).slice(0, 3).map((e: any): Widget => ({
    id: `${e.title}-${e.date?.start_date ?? ""}`.replace(/\s+/g, "-").toLowerCase(),
    title: e.title,
    location: e.address?.[0],
    description: e.date?.start_date,
    type,
    image_url: e.thumbnail || undefined,
    rating: undefined,
    price: undefined,
  }))
}