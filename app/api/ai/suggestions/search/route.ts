import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Widget, EventLabel } from "@/app/itinerary/types/types"
import { searchTicketmaster } from "@/lib/ticketmaster"
import {
  searchGoogleFlights,
  searchGoogleHotels,
  searchSerpTripAdvisor,
} from "@/lib/ai/serp"


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
