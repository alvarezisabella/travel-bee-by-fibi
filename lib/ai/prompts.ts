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

  // Prompts claude with its role and the trip details. This helps it provide relevant and personalized responses.
  return `You are a helpful travel assistant for the trip "${trip.title}" to ${trip.location || "an unspecified destination"}.
          Trip details:
          - Destination: ${trip.location || "not specified"}
          - Dates: ${dateRange}
          - Travelers: ${travelerCount} person${travelerCount !== 1 ? "s" : ""}
          Help the travelers plan and enjoy their trip. Answer questions about the destination, suggest activities, restaurants, and accommodations, recommend what to pack, and provide any other travel advice. Keep responses concise and practical.`
}
