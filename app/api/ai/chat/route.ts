import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/ai/anthropic"
import { buildChatSystemPrompt } from "@/lib/ai/prompts"
import { ChatMessage } from "@/lib/ai/types"
import { Trip } from "@/app/itinerary/types/types"
import { getOrCreateSession, saveMessage, getSessionMessages } from "@/lib/supabase/chat"

// GET /api/ai/chat?itineraryId=xxx
// Loads the persisted chat history for the current user + itinerary pair
export async function GET(req: NextRequest) {
  // Creates a Supabase client
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Checks if user is authenticated
  // If not authenticated, throws error
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const itineraryId = req.nextUrl.searchParams.get('itineraryId')
  if (!itineraryId) {
    return NextResponse.json({ error: "itineraryId is required." }, { status: 400 })
  }

  // Get or create the session, then return all messages for it
  const sessionId = await getOrCreateSession(supabase, user.id, itineraryId)
  const messages = await getSessionMessages(supabase, sessionId)
  return NextResponse.json({ messages })
}

// POST /api/ai/chat
// Receives a new user message, streams back Claude's response, and persists both sides to the DB
export async function POST(req: NextRequest) {
  // Creates a Supabase client
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Checks if user is autheticated
  // If not authenticated, throws error
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // Reads the JSON body from the request
  // messages = the full conversation history so far
  // tripContext = the Trip object, so the API can build the system prompt
  // itineraryId = used to find or create the chat session in the DB
  const { messages, tripContext, itineraryId }: {
    messages: ChatMessage[]
    tripContext: Trip
    itineraryId: string
  } = await req.json()

  // if messages, tripContext, or itineraryId is missing, throws error
  if (!messages || !tripContext || !itineraryId) {
    return NextResponse.json(
      { error: "messages, tripContext, and itineraryId are required." },
      { status: 400 }
    )
  }

  // Get or create the persistent session for this user + itinerary
  const sessionId = await getOrCreateSession(supabase, user.id, itineraryId)

  // Persist the new user message (always the last entry in the array)
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'user') {
    await saveMessage(supabase, sessionId, 'user', lastMessage.content)
  }

  // Collect the full assistant reply while streaming so we can persist it at the end
  let fullResponse = ''

  // Starts a streaming request to the Anthropic API
  // "stream" means Claude sends back text in chunks as it generates, instead of waiting for the full response
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,                            // max length of the reply (~750 words)
    system: buildChatSystemPrompt(tripContext),  // injects trip context so Claude knows about this trip
    messages,                                    // passes the full conversation history
  })

  // Pipes claude's output directly to the browser response
  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Loops over each chunk as it arrives from the api
        // Checks if the chunk is a text update (ignoring other types of updates like "Claude is thinking...")
        for await (const chunk of stream) {
          if ( chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullResponse += chunk.delta.text
            // Converts the text string to bytes and pushes it into the response stream
            // so the browser receives and displays it immediately
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
        // Persist the complete assistant reply once streaming is done
        if (fullResponse) {
          await saveMessage(supabase, sessionId, 'assistant', fullResponse)
        }
      } finally {
        // Closes stream
        controller.close()
      }
    },
  })

  // Sends the stream back to the browser
  // "text/event-stream" tells the browser this is a continuous stream, not a one-shot response
  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream" },
  })
}