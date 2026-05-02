import { Trip } from "@/app/itinerary/types/types"

// Parameters collected from the landing page "Generate with AI" form.
// These drive the Claude prompt for itinerary generation.
export interface ItineraryGenerationParams {
  location: string
  startDate: string       // "YYYY-MM-DD"
  endDate: string         // "YYYY-MM-DD"
  numTravelers: number
  description: string     // trip theme / free-text description from the user
}

// Builds the "system prompt" — background context given to Claude before the
// conversation starts. Claude reads this to understand its role and the trip.
export function buildChatSystemPrompt(trip: Trip): string {
  // Number of travelers in the trip
  const travelerCount = trip.travelers.length

  // Formats the date range, handling cases where dates may not be set
  const dateRange =
    trip.startDate && trip.endDate
      ? `${trip.startDate} to ${trip.endDate}` // both dates set
      : trip.startDate
      ? `starting ${trip.startDate}`           // only start date set
      : "dates not set"                        // no dates

  // List of days that have events
  const daysWithEvents = (trip.days ?? []).filter(d => d.events && d.events.length > 0)

  // If there are no events, skips itinerary section
  // Otherwise, formats each day's events with their time, type, title, status, and optional details like location and description
  const itinerarySection = daysWithEvents.length === 0 ? "" : `
    Scheduled itinerary:
    ${daysWithEvents.map((day, idx) => {
        // Format the day's date as a readable label
        const dateLabel = day.date
          ? new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : `Day ${idx + 1}`

        // Format each event with its time, type, title, and status on the first line,
        // then optional details (location, duration, description) indented below
        const eventsText = day.events.map(event => {
          const lines = [`  - ${event.startTime} | ${event.title} | ${event.type} | (${event.status})`]
          if (event.location)    
            lines.push(`      Location: ${event.location}`)
          if (event.duration)    
            lines.push(`      Duration: ${event.duration} min`)
          if (event.description) 
            lines.push(`      Description: ${event.description}`)
          return lines.join("\n")
        }).join("\n")

        return `Day ${idx + 1} - ${dateLabel}:\n${eventsText}`
      }).join("\n\n")}`

  // Prompts Claude with its role and the trip details so it can provide relevant, personalized responses.
  return `You are a helpful travel assistant for the trip "${trip.title}" to ${trip.location || "an unspecified destination"}.
          You have access to a live search tool that finds real restaurants, activities, and ticketed events including concerts, sports games, and shows. When the user asks for recommendations, always use this tool by outputting a <search> block — never suggest external websites or say you cannot find real-time information.

          Trip details:
          - Destination: ${trip.location || "not specified"}
          - Dates: ${dateRange}
          - Travelers: ${travelerCount} person${travelerCount !== 1 ? "s" : ""}${itinerarySection}

          Help the travelers plan and enjoy their trip. Answer questions about the destination, suggest activities, restaurants, and accommodations, recommend what to pack, and provide any other travel advice.
          Keep responses concise and practical.
          Do not use emojis in your responses.
          Do not use markdown formatting in your responses. Plain text only, with line breaks when needed for clarity.

          ## Response rules

          You have a live search tool. Any time the user asks for recommendations for places, flights, hotels, restaurants, cafes, activities, things to do, events, concerts, shows, sports games, or anything requiring tickets, you MUST output a <search> block. The search tool will find real, up-to-date results — you do not need to know the answer yourself.

          NEVER say you cannot provide real-time information. NEVER suggest external websites, apps, or links. NEVER use bullet points or markdown lists for recommendations. Always use the <search> block instead.

          Use ONLY these types: "Food", "Activity", "Reservation", "Transit".

          Format:
          <search>[
            { "query": "specialty coffee shop", "type": "Food", "location": "Le Marais, Paris" },
            { "query": "impressionist art museum", "type": "Activity", "location": "Paris" },
            { "query": "live jazz concert", "type": "Reservation", "location": "Paris" },
            { "query": "baseball game", "type": "Reservation", "location": "Anaheim, CA" },
            { "query": "jazz concert", "type": "Reservation", "location": "Paris, France" },
            { "query": "flight CDG to JFK", "type": "Transit", "location": "Paris to New York", "departureDate": "2026-04-30" }
          ]</search>

          Rules:
          - query must be a SHORT descriptive search term (2-5 words), NOT a specific place name
          - type must be exactly one of: "Food", "Activity", "Reservation", "Transit"
          - Use "Reservation" for anything involving tickets — hotels, concerts, shows, sports, theater, festivals
          - Use "Transit" for anything involving travel — flights, trains, buses
          - NEVER output a <widgets> block — this format is deprecated. ONLY use <search> blocks.
          - NEVER invent or make up place names, show names, ratings, prices, or descriptions.
          - NEVER say shows "are likely to be playing" — always use a <search> block to find real current listings.
          - location must be as specific as possible — use neighborhood, city, or region
          - output 2-4 search intents per response covering diverse options
          - Write 1 sentence of plain text context before the <search> block. Nothing after.`

}

// Prompt sent to Claude alongside a PDF document to extract event details.
// Claude must return raw JSON only — no markdown fences, no surrounding text.
export function buildPdfExtractionPrompt(): string {
  return `Extract event information from this document and return ONLY a valid JSON object. No markdown fences, no explanation, no surrounding text — raw JSON only.

Use this exact structure:
{
  "title": "Event name",
  "date": "YYYY-MM-DD or null",
  "startTime": "HH:MM in 24-hour format or null",
  "endTime": "HH:MM in 24-hour format or null",
  "location": "Venue name and/or address or null",
  "type": "Reservation",
  "description": "Brief one-sentence description or null"
}

Rules:
- "type" must be exactly one of: "Activity", "Transit", "Reservation", "Food". Default to "Reservation" for tickets and bookings.
- If a field cannot be determined from the document, use null.
- "date" must be in YYYY-MM-DD format if present.
- "startTime" and "endTime" must be in HH:MM 24-hour format if present.
- Output only the JSON object. Nothing else.`
}

// Builds the one-shot user prompt for AI itinerary generation.
// Unlike buildChatSystemPrompt (which is used for the ongoing chat assistant),
// this prompt is sent as a single user message asking Claude to return a
// structured JSON itinerary — no streaming, no follow-up turns.
export function buildItineraryGenerationPrompt(params: ItineraryGenerationParams): string {
  return `You are a travel itinerary planner. Generate a complete day-by-day travel itinerary as a single valid JSON object. Do not include any text before or after the JSON. Do not use markdown code fences. Output only raw JSON.

Trip details:
- Destination: ${params.location}
- Start date: ${params.startDate}
- End date: ${params.endDate}
- Number of travelers: ${params.numTravelers}
- Theme / description: ${params.description}

Return this exact JSON structure:
{
  "title": "A creative, descriptive title for this trip",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "events": [
        {
          "title": "Event title",
          "description": "1 sentence description",
          "type": "Activity",
          "status": "Confirmed",
          "startTime": "HH:MM",
          "duration": 90,
          "location": "Specific venue name and address"
        }
      ]
    }
  ]
}

Rules:
- image_url for the itinerary is optional — only include if you have a real URL, never use placeholder URLs
- Include every day from ${params.startDate} to ${params.endDate} inclusive.
- Each day must have between 3 and 5 events.
- "type" must be exactly one of: "Activity", "Transit", "Reservation", "Food"
- "status" must be "Confirmed" for all events.
- "startTime" must be in 24-hour HH:MM format (e.g. "09:00", "14:30").
- "duration" is an integer representing minutes (e.g. 60, 90, 120).
- Events within a day must not overlap in time.
- The first event of each day should start no earlier than 07:00.
- Schedule realistic travel and meal times appropriate for ${params.location}.
- Do not add any commentary. Return only the JSON object.`
}