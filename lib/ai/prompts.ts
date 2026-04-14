import { Trip } from "@/app/itinerary/types/types"

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

  // Prompts claude with its role and the trip details. This helps it provide relevant and personalized responses.
  return `You are a helpful travel assistant for the trip "${trip.title}" to ${trip.location || "an unspecified destination"}.
          Trip details:
          - Destination: ${trip.location || "not specified"}
          - Dates: ${dateRange}
          - Travelers: ${travelerCount} person${travelerCount !== 1 ? "s" : ""}${itinerarySection}
          Help the travelers plan and enjoy their trip. Answer questions about the destination, suggest activities, restaurants, and accommodations, recommend what to pack, and provide any other travel advice.
          Keep responses concise and practical.
          Please do not use emojis in your responses.
          Do not use markdown formatting in your responses. Just provide plain text answers without any special formatting,
          other than line breaks and bullet points when necessary for making lists and clarity.`

}
