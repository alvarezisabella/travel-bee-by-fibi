import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/ai/anthropic"
import { buildItineraryGenerationPrompt } from "@/lib/ai/prompts"

// ─── Types ───────────────────────────────────────────────────────────────────
// These mirror the JSON structure Claude is instructed to return.
// They are exported so the /plan page and /ai-template page can share them
// without re-declaring the same shapes.

export interface GeneratedEvent {
  title: string
  description?: string
  type: string      // "Activity" | "Transit" | "Reservation" | "Food"
  status: string    // "Confirmed"
  startTime: string // "HH:MM" 24-hour format
  duration: number  // minutes
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

// ─── Module-level constants ───────────────────────────────────────────────────

// Reused for every SSE write — TextEncoder is stateless so one instance is fine.
const encoder = new TextEncoder()

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Strips markdown code fences that Claude occasionally adds despite the prompt
// telling it not to (e.g. ```json ... ```). Falls back to slicing from the
// outermost { ... } so stray leading/trailing text doesn't break JSON.parse().
function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1)

  return raw.trim()
}

// Lightweight structural check — we only validate the fields we actually use
// when rendering and saving. Full exhaustive validation isn't needed here
// because the downstream save route re-validates before writing to the DB.
function validateGeneratedItinerary(parsed: unknown): parsed is GeneratedItinerary {
  if (typeof parsed !== 'object' || parsed === null) return false
  const obj = parsed as Record<string, unknown>

  if (typeof obj.title !== 'string' || !obj.title) return false
  if (!Array.isArray(obj.days)) return false

  for (const day of obj.days as unknown[]) {
    if (typeof day !== 'object' || day === null) return false
    const d = day as Record<string, unknown>

    if (typeof d.date !== 'string') return false
    if (!Array.isArray(d.events)) return false

    for (const ev of d.events as unknown[]) {
      if (typeof ev !== 'object' || ev === null) return false
      const e = ev as Record<string, unknown>

      // Only check the three fields used during event rendering
      if (typeof e.title !== 'string' || !e.title) return false
      if (typeof e.startTime !== 'string') return false
      if (typeof e.duration !== 'number') return false
    }
  }

  return true
}

// Serialises a payload into the SSE wire format: "data: <json>\n\n"
// The double newline is the SSE event delimiter — the client splits on "\n\n"
// to separate events. The client never sees the raw bytes directly; it reads
// the ReadableStream via getReader() and re-assembles events from the buffer.
function sseEvent(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
}

// ─── Route Handler ────────────────────────────────────────────────────────────

// POST /api/ai/generate-itinerary
//
// Calls Claude and streams the response back to the client as SSE events:
//
//   { type: "chunk",   text: "..."       }  — raw text delta, emitted as Claude writes
//   { type: "done",    itinerary: {...}  }  — validated JSON object when generation is complete
//   { type: "error",   message: "..."    }  — sent on any failure before the stream closes
//
// Streaming (vs. the old blocking messages.create()) means the client gets the
// first byte almost immediately, so it can show real progress instead of a
// blank spinner for the full generation time (~10–20 s for a week-long trip).
export async function POST(req: NextRequest) {
  const { location, startDate, endDate, numTravelers, description } = await req.json()

  if (!location || !startDate || !endDate || !numTravelers || !description) {
    return NextResponse.json(
      { error: 'location, startDate, endDate, numTravelers, and description are all required.' },
      { status: 400 }
    )
  }

  const prompt = buildItineraryGenerationPrompt({
    location,
    startDate,
    endDate,
    numTravelers: Number(numTravelers), // coerce string → number if sent from a form
    description,
  })

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          // 8192 handles up to ~14-day trips with 5 events/day at comfortable description
          // lengths. 4096 was too low — a 7-night trip with detailed output could truncate
          // mid-JSON, causing JSON.parse to throw.
          max_tokens: 8192,
          messages: [{ role: 'user', content: prompt }],
        })

        // Forward each text delta to the client immediately as a "chunk" event.
        // This is what makes the progress bar on the /plan page advance in real time.
        // We intentionally don't accumulate text here — finalMessage() below gives
        // us the complete text once the loop drains, with no extra round trip.
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(sseEvent({ type: 'chunk', text: chunk.delta.text }))
          }
        }

        // After the for-await loop exhausts the stream, finalMessage() returns the
        // already-resolved Message object with no additional wait. We use it to:
        //   1. Check if the response was truncated (stop_reason === 'max_tokens')
        //   2. Extract the full text from content blocks for JSON parsing
        const final = await stream.finalMessage()

        if (final.stop_reason === 'max_tokens') {
          // Truncated mid-JSON means JSON.parse would throw a confusing error.
          // Surface the real cause so the user knows to try a shorter date range.
          controller.enqueue(sseEvent({
            type: 'error',
            message: 'The itinerary was too long to generate. Try a shorter date range.',
          }))
          return
        }

        // Reconstruct the full response text from the content blocks.
        // Claude can theoretically split output across multiple text blocks,
        // so we join them all rather than assuming a single block.
        const fullText = final.content
          .filter(b => b.type === 'text')
          .map(b => (b as { type: 'text'; text: string }).text)
          .join('')

        const cleaned = extractJSON(fullText)
        const parsed: unknown = JSON.parse(cleaned)

        if (!validateGeneratedItinerary(parsed)) {
          throw new Error('Response did not match expected itinerary structure.')
        }

        // Send the validated itinerary as the final SSE event.
        // The client stores this in sessionStorage and transitions to the review view.
        controller.enqueue(sseEvent({ type: 'done', itinerary: parsed }))
      } catch (err) {
        console.error('[generate-itinerary] Error:', err)
        controller.enqueue(sseEvent({
          type: 'error',
          message: 'Failed to generate itinerary. Please try again.',
        }))
      } finally {
        // Always close the stream — this tells the client's reader that no more
        // data is coming, breaking it out of the while(true) read loop.
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      // Keep-Alive prevents proxies and load balancers from closing the
      // long-lived SSE connection before Claude finishes generating.
      'Connection': 'keep-alive',
    },
  })
}
