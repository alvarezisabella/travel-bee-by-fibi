import { Widget, EventLabel } from "@/app/itinerary/types/types"

const SERP_BASE = "https://serpapi.com/search.json"

// Cache IATA lookups to avoid repeat API calls for the same city
const iataCache = new Map<string, string>()

export async function getCityIATA(location: string): Promise<string | null> {
  const key = process.env.SERPAPI_KEY
  if (!key) return null

  const lower = location.toLowerCase().trim()

  // Return cached result if available
  if (iataCache.has(lower)) return iataCache.get(lower)!

  // If it already looks like an IATA code (3 uppercase letters), use it directly
  // This handles "SNA", "JFK", "LAX" etc. that Claude outputs in the query
  const iataMatch = location.trim().match(/^([A-Z]{3})$/)
  if (iataMatch) {
    console.log("IATA DIRECT MATCH:", location)
    return location.trim()
  }

  // Also check if IATA code is embedded in the string e.g. "flight SNA to JFK"
  const embeddedMatch = location.match(/\b([A-Z]{3})\b/)
  if (embeddedMatch) {
    console.log("IATA EMBEDDED MATCH:", embeddedMatch[1], "from:", location)
    iataCache.set(lower, embeddedMatch[1])
    return embeddedMatch[1]
  }

  // Fall back to autocomplete API for city names
  const url =
    `${SERP_BASE}?engine=google_flights_autocomplete` +
    `&q=${encodeURIComponent(location)}` +
    `&api_key=${key}`

  console.log("IATA LOOKUP URL:", url)

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error("IATA LOOKUP ERROR:", res.status)
      return null
    }

    const data = await res.json()
    console.log("IATA RAW RESPONSE:", JSON.stringify(data, null, 2))

    // Try different response keys — SerpAPI may use airports, results, or data
    const airport =
      data.airports?.[0] ??
      data.results?.[0] ??
      data.data?.[0]

    const code = airport?.id ?? airport?.iata_code ?? null

    if (code) {
      iataCache.set(lower, code)
      console.log("IATA RESOLVED:", location, "→", code)
    } else {
      console.warn("IATA NOT FOUND for:", location)
    }

    return code
  } catch (e) {
    console.error("IATA LOOKUP FAILED:", e)
    return null
  }
}

export async function searchGoogleFlights(
  originLocation: string,
  destinationLocation: string,
  departureDate: string,
  adults: number,
  intentIndex: number
): Promise<Widget[]> {
  const key = process.env.SERPAPI_KEY
  if (!key) {
    console.error("SERPAPI_KEY not set")
    return []
  }

  // Resolve both IATA codes in parallel
  const [origin, destination] = await Promise.all([
    getCityIATA(originLocation),
    getCityIATA(destinationLocation),
  ])

  if (!origin || !destination) {
    console.error("GOOGLE FLIGHTS: could not resolve IATA for:", originLocation, "→", destinationLocation)
    return []
  }

  const url =
    `${SERP_BASE}?engine=google_flights` +
    `&departure_id=${origin}` +
    `&arrival_id=${destination}` +
    `&outbound_date=${departureDate}` +
    `&type=2` +
    `&currency=USD` +
    `&hl=en` +
    `&api_key=${key}`

  console.log("GOOGLE FLIGHTS URL:", url)

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error("GOOGLE FLIGHTS ERROR:", res.status, await res.text())
      return []
    }

    const data = await res.json()
    const flights = [...(data.best_flights ?? []), ...(data.other_flights ?? [])]
    console.log("GOOGLE FLIGHTS FOUND:", flights.length)
    console.log("GOOGLE FLIGHTS FIRST:", JSON.stringify(flights[0], null, 2))

    const widgets: Widget[] = []

    for (let i = 0; i < Math.min(flights.length, 3); i++) {
    const offer = flights[i]
    if (!offer?.flights?.length) continue

    const firstLeg = offer.flights[0]
    const lastLeg = offer.flights[offer.flights.length - 1]
    const stops = offer.flights.length - 1

    // Departure and arrival times
    const depTime = firstLeg.departure_airport?.time?.slice(11, 16) ?? "" // "10:10"
    const arrTime = lastLeg.arrival_airport?.time?.slice(11, 16) ?? ""    // "16:50"

    // Total duration
    const totalMins = offer.total_duration ?? 0
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    const duration = `${hours}h ${mins}m`

    // Flight numbers for all legs
    const flightNumbers = offer.flights
        .map((f: any) => f.flight_number)
        .filter(Boolean)
        .join(" → ")

    // Layover info
    const layoverInfo = offer.layovers?.length
        ? offer.layovers.map((l: any) => {
            const lh = Math.floor(l.duration / 60)
            const lm = l.duration % 60
            return `${lh}h ${lm}m layover at ${l.id}`
        }).join(", ")
        : null

    // Baggage and policy from extensions
    const policy = offer.extensions?.find((e: string) =>
        /refund|change|baggage/i.test(e)
    ) ?? null

    // Carbon emissions comparison
    const carbon = offer.carbon_emissions
    const carbonInfo = carbon
        ? carbon.difference_percent <= 0
        ? `${Math.abs(carbon.difference_percent)}% lower emissions than avg`
        : `${carbon.difference_percent}% higher emissions than avg`
        : null

    // Build description — all key details in one line
    const descriptionParts = [
        `${depTime} → ${arrTime}`,
        stops === 0 ? "Nonstop" : `${stops} stop${stops > 1 ? "s" : ""}`,
        duration,
        layoverInfo,
        flightNumbers,
        firstLeg.travel_class,
        firstLeg.airplane,
        policy,
        carbonInfo,
    ].filter(Boolean)

    const description = descriptionParts.join(" · ")

    const bookingUrl = offer.booking_token
    ? `https://www.google.com/travel/flights?hl=en&gl=us&curr=USD&tfs=${offer.booking_token}&tfu=EgIIAQ`
    : data.search_metadata?.google_flights_url
    ?? `https://www.google.com/travel/flights#flt=${origin}.${destination}.${departureDate};c:USD;e:1;sd:1;t:f`

    console.log("FLIGHT BOOKING URL:", bookingUrl)

    widgets.push({
    id: `gflight-${origin}-${destination}-${i}-${intentIndex}`,
    title: `${firstLeg.airline ?? ""} · ${origin} → ${destination}`,
    location: `${firstLeg.departure_airport?.name} → ${lastLeg.arrival_airport?.name}`,
    description,
    type: "Transit",
    image_url: offer.airline_logo ?? firstLeg.airline_logo ?? undefined,
    rating: undefined,
    price: offer.price ?? undefined,
    url: bookingUrl,
    })

    console.log("GOOGLE FLIGHT BUILT:", widgets[widgets.length - 1].title, "| price:", offer.price)
    console.log("OFFER KEYS:", Object.keys(offer))
    console.log("OFFER URL:", offer.google_flights_url)
    console.log("OFFER TOKEN:", offer.booking_token)
    console.log("SEARCH META:", JSON.stringify(data.search_metadata, null, 2))
    }   

    return widgets
  } catch (e) {
    console.error("GOOGLE FLIGHTS FETCH ERROR:", e)
    return []
  }
}

export async function searchGoogleHotels(
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  intentIndex: number
): Promise<Widget[]> {
  const key = process.env.SERPAPI_KEY
  if (!key) {
    console.error("SERPAPI_KEY not set")
    return []
  }

  const url =
    `${SERP_BASE}?engine=google_hotels` +
    `&q=${encodeURIComponent(location + " hotels")}` +
    `&check_in_date=${checkIn}` +
    `&check_out_date=${checkOut}` +
    `&adults=${adults}` +
    `&currency=USD` +
    `&hl=en` +
    `&api_key=${key}`

  console.log("GOOGLE HOTELS URL:", url)

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error("GOOGLE HOTELS ERROR:", res.status, await res.text())
      return []
    }

    const data = await res.json()
    const properties = data.properties ?? []
    console.log("GOOGLE HOTELS FOUND:", properties.length)
    console.log("GOOGLE HOTELS FIRST:", JSON.stringify(properties[0], null, 2))

    const widgets: Widget[] = []

    for (let i = 0; i < Math.min(properties.length, 3); i++) {
      const h = properties[i]
      if (!h) continue

      const priceStr = h.rate_per_night?.lowest ?? h.total_rate?.lowest ?? ""
      const price = priceStr ? parseInt(priceStr.replace(/[^0-9]/g, "")) : undefined

      const description = [
        h.type,
        h.amenities?.slice(0, 3).join(", "),
      ].filter(Boolean).join(" · ") || undefined

      const bookingUrl =
        h.link ??
        `https://www.google.com/travel/hotels/s/${encodeURIComponent(location)}`

      widgets.push({
        id: `ghotel-${h.property_token ?? i}-${intentIndex}`,
        title: h.name,
        location: h.neighborhood ?? location,
        description,
        type: "Reservation",
        image_url: h.images?.[0]?.thumbnail ?? h.thumbnail ?? undefined,
        rating: h.overall_rating ?? undefined,
        price,
        url: bookingUrl,
      })

      console.log("GOOGLE HOTEL BUILT:", h.name, "| price:", price, "| rating:", h.overall_rating)
    }

    return widgets
  } catch (e) {
    console.error("GOOGLE HOTELS FETCH ERROR:", e)
    return []
  }
}