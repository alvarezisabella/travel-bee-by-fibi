import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/ai/anthropic"
import { buildPdfExtractionPrompt } from "@/lib/ai/prompts"
import { getOrCreateSession, saveMessage } from "@/lib/supabase/chat"
import { PdfEventData } from "@/app/itinerary/types/types"

// POST /api/ai/parse-pdf
// Accepts a PDF file via multipart form data, sends it to Claude for extraction,
// persists the exchange to chat history, and returns structured PdfEventData.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const itineraryId = formData.get("itineraryId") as string | null

  if (!file || !itineraryId) {
    return NextResponse.json({ error: "file and itineraryId are required." }, { status: 400 })
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 })
  }

  // Convert the PDF to base64 for the Anthropic document content block
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString("base64")

  let pdfEvent: PdfEventData
  try {
    const response = await anthropic.beta.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      betas: ["pdfs-2024-09-25"],
      messages: [
        {
          role: "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: buildPdfExtractionPrompt(),
            },
          ] as any,
        },
      ],
    })

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      // Strip markdown code fences if Claude wraps in them despite instructions
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    const parsed = JSON.parse(raw)

    pdfEvent = {
      title: parsed.title ?? "Untitled Event",
      date: parsed.date ?? undefined,
      startTime: parsed.startTime ?? undefined,
      endTime: parsed.endTime ?? undefined,
      location: parsed.location ?? undefined,
      type: (["Activity", "Transit", "Reservation", "Food"].includes(parsed.type)
        ? parsed.type
        : "Reservation") as PdfEventData["type"],
      description: parsed.description ?? undefined,
    }
  } catch (e) {
    console.error("PDF extraction failed:", e)
    return NextResponse.json({ error: "Failed to extract event info from PDF." }, { status: 500 })
  }

  // Persist user + assistant messages to chat history
  try {
    const sessionId = await getOrCreateSession(supabase, user.id, itineraryId)
    await saveMessage(supabase, sessionId, "user", `[PDF: ${file.name}]`)
    await saveMessage(
      supabase,
      sessionId,
      "assistant",
      `I found an event in your PDF. Here are the details:\n<pdf-event>${JSON.stringify(pdfEvent)}</pdf-event>`
    )
  } catch (e) {
    // Non-fatal: extraction succeeded, just log the persistence failure
    console.error("Failed to persist PDF chat messages:", e)
  }

  return NextResponse.json(pdfEvent)
}
