import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/ai/anthropic"
import { buildItineraryGenerationPrompt } from "@/lib/ai/prompts"

// ─── Types ───────────────────────────────────────────────────────────────────
// These mirror the JSON structure Claude is instructed to return.
// They are file-local because only this route and save-itinerary need them;
// the full Trip/Event types from types.ts include DB-specific fields (ids, votes, etc.)
// that don't exist yet at generation time.

export interface GeneratedEvent {
  title: string
  description?: string
  type: string           // "Activity" | "Transit" | "Reservation" | "Food"
  status: string         // "Confirmed"
  startTime: string      // "HH:MM" 24-hour format
  duration: number       // minutes
  location?: string
}

export interface GeneratedDay {
  date: string           // "YYYY-MM-DD"
  events: GeneratedEvent[]
}

export interface GeneratedItinerary {
  title: string
  days: GeneratedDay[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Strips markdown code fences that Claude may add despite the prompt instructing
// it not to (e.g. ```json ... ```). Falls back to slicing from the first '{' to
// the last '}' so stray leading/trailing text doesn't break JSON.parse().
function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // If no fence, look for the outermost object braces
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1)

  return raw.trim()
}

// Validates that the parsed value matches the expected GeneratedItinerary shape.
// Keeps the validation lightweight — we check the fields we actually rely on
// when inserting events, rather than validating every possible key.
function validateGeneratedItinerary(parsed: unknown): parsed is GeneratedItinerary {
  if (typeof parsed !== 'object' || parsed === null) return false
  const obj = parsed as Record<string, unknown>

  // Must have a non-empty string title
  if (typeof obj.title !== 'string' || !obj.title) return false

  // Must have a days array
  if (!Array.isArray(obj.days)) return false

  for (const day of obj.days as unknown[]) {
    if (typeof day !== 'object' || day === null) return false
    const d = day as Record<string, unknown>

    // Each day needs a date string and an events array
    if (typeof d.date !== 'string') return false
    if (!Array.isArray(d.events)) return false

    for (const ev of d.events as unknown[]) {
      if (typeof ev !== 'object' || ev === null) return false
      const e = ev as Record<string, unknown>

      // Each event needs the three fields we use when inserting
      if (typeof e.title !== 'string' || !e.title) return false
      if (typeof e.startTime !== 'string') return false
      if (typeof e.duration !== 'number') return false
    }
  }

  return true
}

// ─── Route Handler ────────────────────────────────────────────────────────────

// POST /api/ai/generate-itinerary
// Calls Claude with a structured JSON prompt and returns the generated itinerary.
// IMPORTANT: This route does NOT write to the database. The client stores the
// result in sessionStorage and the user reviews it on /ai-template before saving.
export async function POST(req: NextRequest) {
  // Creates a Supabase client using the current request cookies
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Checks if the user is authenticated — generation requires an account so
  // the itinerary can be attributed to a user when they later click Save
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Reads the trip parameters sent by the landing page form
  const { location, startDate, endDate, numTravelers, description } = await req.json()

  // All five fields are required to build a meaningful itinerary prompt
  if (!location || !startDate || !endDate || !numTravelers || !description) {
    return NextResponse.json({ error: 'location, startDate, endDate, numTravelers, and description are all required.' }, { status: 400 })
  }

  // Calls Claude using the non-streaming create() method (not stream()) because
  // we need to receive and parse the full JSON response before returning it.
  // max_tokens: 8192 handles up to ~14-day trips with 5 events/day at comfortable
  // description lengths. 4096 was too low — a 7-night trip with detailed output
  // could truncate mid-JSON, causing JSON.parse to throw.
  // Wrapped in try/catch because the Anthropic SDK throws on network errors,
  // rate limits (429), or service outages — without this, the route returns
  // a generic Next.js 500 with no useful error message for the client.
  let rawText: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: buildItineraryGenerationPrompt({
            location,
            startDate,
            endDate,
            numTravelers: Number(numTravelers), // coerce string → number if sent from a form
            description,
          }),
        },
      ],
    })

    // If Claude hit the output limit mid-response the JSON will be truncated
    // and unparseable. Surface this as a specific error rather than a confusing
    // parse failure so the user knows to try a shorter date range.
    if (message.stop_reason === 'max_tokens') {
      console.error('[generate-itinerary] Claude response was truncated (max_tokens reached)')
      return NextResponse.json(
        { error: 'The itinerary was too long to generate. Try a shorter date range.' },
        { status: 500 }
      )
    }

    // Concatenates all text blocks from the response (Claude may split across blocks)
    rawText = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')
  } catch (err) {
    console.error('[generate-itinerary] Anthropic API error:', err)
    return NextResponse.json(
      { error: 'The AI service is temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }

  // Parses and validates the response. extractJSON handles cases where Claude
  // wraps the JSON in a code fence despite being told not to.
  let itinerary: GeneratedItinerary
  try {
    const cleaned = extractJSON(rawText)
    const parsed: unknown = JSON.parse(cleaned)
    if (!validateGeneratedItinerary(parsed)) {
      throw new Error('Response did not match expected itinerary structure.')
    }
    itinerary = parsed
  } catch (err) {
    // Log the raw output so developers can debug prompt issues
    console.error('[generate-itinerary] Failed to parse Claude output:', rawText, err)
    return NextResponse.json(
      { error: 'Failed to parse AI response. Please try again.' },
      { status: 500 }
    )
  }

  // Returns the structured itinerary JSON to the client.
  // The client stores this in sessionStorage and navigates to /ai-template.
  return NextResponse.json({ itinerary }, { status: 200 })
}
