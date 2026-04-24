// app/api/ai/suggestions/enrich/route.ts

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { fetchYelpWidgets, fetchGoogleEventsWidgets } from "@/lib/ai/serp-sources/serp"
import { Widget, EventLabel } from "@/app/itinerary/types/types"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { widgets, location }: { widgets: Widget[]; location: string } = await req.json()
  if (!widgets?.length || !location) {
    return NextResponse.json({ error: "widgets and location are required." }, { status: 400 })
  }

  // Enrich each Claude-generated widget stub with real API data
  const enriched = await Promise.all(
    widgets.map(async (widget) => {
      try {
        if (widget.type === "Food" || widget.type === "Reservation") {
          const results = await fetchYelpWidgets(widget.title, location, widget.type)
          // Merge: keep Claude's title/description, but use real rating, price, image, location
          return results[0] ? mergeWidget(widget, results[0]) : widget
        } else {
          const results = await fetchGoogleEventsWidgets(widget.title, location, widget.type)
          return results[0] ? mergeWidget(widget, results[0]) : widget
        }
      } catch {
        console.error("Error fetching SERP data for widget:", widget)
        return widget // fall back to Claude's stub if API fails
      }
    })
  )

  return NextResponse.json({ widgets: enriched })
}

// Merge Claude's stub with real API data — prefer real data for factual fields,
// keep Claude's title and description since they match the conversation context
function mergeWidget(stub: Widget, real: Widget): Widget {
  return {
    ...stub,
    location: real.location ?? stub.location,
    image_url: real.image_url ?? stub.image_url,
    rating: real.rating ?? stub.rating,
    price: real.price ?? stub.price,
  }
}