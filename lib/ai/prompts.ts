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
          Trip details:
          - Destination: ${trip.location || "not specified"}
          - Dates: ${dateRange}
          - Travelers: ${travelerCount} person${travelerCount !== 1 ? "s" : ""}${itinerarySection}
          Help the travelers plan and enjoy their trip. Answer questions about the destination, suggest activities, restaurants, and accommodations, recommend what to pack, and provide any other travel advice.
          Keep responses concise and practical.
          Please do not use emojis in your responses.
          Do not use markdown formatting in your responses. Just provide plain text answers without any special formatting,
          other than line breaks and bullet points when necessary for making lists and clarity.
            ## Response rules

          Any time the user asks for recommendations for places, restaurants, cafes, activities, or things to do, you MUST output a <search> block. Never make up place names, ratings, prices, or descriptions.

          Use ONLY these types: "Activity", "Transit", "Reservation", "Food".

          Format:
          <search>[
            { "query": "specialty coffee shop", "type": "Food", "location": "Le Marais, Paris" },
            { "query": "rooftop bar", "type": "Food", "location": "Saint-Germain, Paris" },
            { "query": "impressionist art museum", "type": "Activity", "location": "Paris" }
          ]</search>

          Rules:
          - id must be a unique string
          - type must be exactly one of: "Activity", "Transit", "Reservation", "Food"
          - query must be a SHORT descriptive search term (2-5 words), NOT a specific place name
          - location must be as specific as possible — use neighborhood or district, not just the city
          - output 2-4 search intents per response, covering diverse options
          - NEVER write place names, ratings, prices, or addresses in your response text
          - NEVER use bullet points or markdown lists for recommendations
          - NEVER split recommendations by city or day — all intents go in one <search> block
          - Write 1 sentence of context before the <search> block. Nothing after.`

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