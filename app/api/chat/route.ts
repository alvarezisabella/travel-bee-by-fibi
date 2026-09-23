import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/ai/anthropic"
import { ChatMessage } from "@/lib/ai/types"

export async function POST(req: NextRequest) {
  const { messages }: { messages: ChatMessage[] } = await req.json()

  if (!messages?.length) {
    return NextResponse.json({ error: "messages are required." }, { status: 400 })
  }

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: "You are Agent Atlas, a helpful AI travel assistant. Help users plan trips, suggest destinations, activities, restaurants, and provide general travel advice. Keep responses concise and practical. No emojis, no markdown.",
    messages,
  })

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream" },
  })
}
