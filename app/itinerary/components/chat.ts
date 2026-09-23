import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message, Widget, PdfEventData } from "../types/types";
import { Trip } from "../types/types";
import { ChatMessage } from "@/lib/ai/types";

// Extracts a JSON search block from the AI response and returns the cleaned text
// alongside parsed search intents. The block is hidden from the user but drives
// the suggestion search API call.
function parseSearch(raw: string): {
  text: string
  intents?: { query: string; type: string; location: string }[]
} {
  const match = raw.match(/<search>\s*([\s\S]*?)\s*<\/search>/)
  const text = raw
    .replace(/<search>\s*[\s\S]*?\s*<\/search>/, "")
    .trim()

  if (!match) return { text }

  try {
    const intents = JSON.parse(match[1].trim())
    return { text, intents }
  } catch (e) {
    console.error("PARSE SEARCH FAILED:", e)
    return { text }
  }
}

// Extracts an itinerary action block emitted by the AI when it wants to add or
// delete an event. Returns the display text with the block stripped out.
function parseItineraryAction(raw: string): {
  text: string
  action?: { type: string; eventId?: string; eventTitle?: string; date?: string; title?: string; startTime?: string; duration?: number; eventType?: string; status?: string; location?: string; description?: string }
} {
  const match = raw.match(/<itinerary-action>\s*([\s\S]*?)\s*<\/itinerary-action>/)
  const text = raw.replace(/<itinerary-action>[\s\S]*?<\/itinerary-action>/, "").trim()
  if (!match) return { text }
  try {
    return { text, action: JSON.parse(match[1].trim()) }
  } catch {
    return { text }
  }
}

// Removes all structured XML blocks from the streaming text so the user only
// sees the plain conversational response while the stream is still in progress.
// Handles incomplete (open but not yet closed) tags so mid-stream chunks look clean.
function stripStreamingBlocks(text: string): string {
  return text
    .replace(/<itinerary-action>[\s\S]*?<\/itinerary-action>/g, "")
    .replace(/<itinerary-action>[\s\S]*$/, "")
    .replace(/<search>[\s\S]*?<\/search>/g, "")
    .replace(/<search>[\s\S]*$/, "")
    .replace(/<pdf-event>[\s\S]*?<\/pdf-event>/g, "")
    .replace(/<pdf-event>[\s\S]*$/, "")
    .replace(/<widgets>[\s\S]*?<\/widgets>/g, "")
    .replace(/<widgets>[\s\S]*$/, "")
    .trim()
}

// Extracts a structured event block that the AI emits after parsing a PDF upload.
// The block carries pre-filled event fields the user can review before saving.
function parsePdfEvent(raw: string): {
  text: string
  pdfEvent?: PdfEventData
} {
  const match = raw.match(/<pdf-event>\s*([\s\S]*?)\s*<\/pdf-event>/)
  const text = raw.replace(/<pdf-event>\s*[\s\S]*?\s*<\/pdf-event>/, "").trim()
  if (!match) return { text }
  try {
    const pdfEvent = JSON.parse(match[1].trim()) as PdfEventData
    return { text, pdfEvent }
  } catch {
    return { text }
  }
}


export function chat(trip: Trip) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load existing chat history and saved suggestion widgets on mount.
  // Suggestions are stored separately from messages and are rejoined by message_id.
  useEffect(() => {
    async function loadHistory() {
      const [chatRes, suggestionsRes] = await Promise.all([
        fetch(`/api/ai/chat?itineraryId=${trip.id}`),
        fetch(`/api/ai/suggestions?itineraryId=${trip.id}`),
      ])

      if (!chatRes.ok) return

      const { messages: dbMessages } = await chatRes.json()
      const { suggestions } = suggestionsRes.ok
        ? await suggestionsRes.json()
        : { suggestions: [] }

      console.log("DB MESSAGES:", dbMessages.length)
      console.log("DB SUGGESTIONS:", suggestions?.length)

      // Build a lookup of widgets keyed by message_id so each bot message
      // can have its place cards reattached when rendering history.
      const widgetsByMessageId = new Map<string, Widget[]>()

      for (const s of suggestions ?? []) {
        try {
          const parsed = JSON.parse(s.content)
          if (Array.isArray(parsed) && parsed[0]?.title) {
            if (s.message_id) {
              // Merge widgets when multiple suggestion rows share the same message_id
              const existing = widgetsByMessageId.get(s.message_id) ?? []
              widgetsByMessageId.set(s.message_id, [...existing, ...parsed])
              console.log("MAPPED WIDGETS TO MSG:", s.message_id, parsed.length, "widgets")
            } else {
              console.warn("SUGGESTION HAS NO MESSAGE ID:", s.id)
            }
          }
        } catch {
          console.error("FAILED TO PARSE SUGGESTION:", s.id)
        }
      }

      console.log("WIDGETS MAP SIZE:", widgetsByMessageId.size)

      // Strip hidden AI blocks from each saved message before displaying it,
      // then reattach any widgets that were saved for that message.
      const uiMessages: Message[] = dbMessages.map(
        (m: { id: string; role: string; content: string; created_at: string }) => {
          const { text: withoutAction } = parseItineraryAction(m.content)
          const { text: searchText } = parseSearch(withoutAction)
          const { text, pdfEvent } = parsePdfEvent(searchText)
          const widgets = widgetsByMessageId.get(m.id)
          console.log("MESSAGE:", m.id, "role:", m.role, "widgets:", widgets?.length ?? 0)
          return {
            id: m.id,
            text,
            pdfEvent,
            widgets,
            sender: m.role === "user" ? "user" : "bot",
            timestamp: new Date(m.created_at),
          }
        }
      )

      // Show a welcome message when there is no prior conversation history
      if (uiMessages.length === 0) {
        setMessages([{
          id: "welcome",
          text: "Hi! I'm Agent Atlas, your AI travel assistant. Ask me anything about your trip!",
          sender: "bot",
          timestamp: new Date(),
        }]);
      } else {
        setMessages(uiMessages);
      }
    }
    loadHistory()
  }, [trip.id]);

  const toggle = useCallback(() => setIsCollapsed((prev) => !prev), []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    // Reconstruct the full conversation history for the API, including widget
    // context that was shown to the user so the AI knows what was suggested before.
    const chatMessages: ChatMessage[] = [
      ...messages.map((m) => {
        if (m.sender !== "bot") {
          return { role: "user" as const, content: m.text }
        }
        const widgetBlock = m.widgets?.length
          ? `<widgets>${JSON.stringify(m.widgets)}</widgets>`
          : ""
        return {
          role: "assistant" as const,
          content: m.text + (widgetBlock ? "\n" + widgetBlock : ""),
        }
      }),
      { role: "user", content: currentInput },
    ]

    const botMsgId = crypto.randomUUID();
    let botMsgAdded = false;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          tripContext: trip,
          itineraryId: trip.id,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to send message");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";

      // Stream the response chunk by chunk, showing only the clean display text
      // while accumulating the full raw text for post-stream parsing.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botText += decoder.decode(value, { stream: true });
        const streamText = stripStreamingBlocks(botText);

        if (!botMsgAdded) {
          setMessages((prev) => [
            ...prev,
            { id: botMsgId, text: streamText, sender: "bot", timestamp: new Date() },
          ]);
          botMsgAdded = true;
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: streamText } : m))
          );
        }
      }

      // Parse the full response after streaming completes to extract any action or search blocks
      const { text: withoutAction, action } = parseItineraryAction(botText)
      const { text, intents } = parseSearch(withoutAction)
      console.log("PARSED TEXT:", text)
      console.log("PARSED INTENTS:", intents?.length)

      // Execute any itinerary mutations the AI requested before updating the message text
      if (action?.type === "delete" && action.eventId) {
        fetch("/api/auth/event", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: action.eventId, itineraryid: trip.id, title: action.eventTitle }),
        })
          .then(() => router.refresh())
          .catch(e => console.error("FAILED TO DELETE EVENT:", e))
      }

      if (action?.type === "add" && action.date && action.title) {
        fetch("/api/auth/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itineraryid: trip.id,
            title: action.title,
            day: action.date,
            startTime: action.startTime ?? null,
            duration: action.duration ?? null,
            type: action.eventType ?? "Activity",
            status: action.status ?? "Confirmed",
            location: action.location ?? null,
            description: action.description ?? null,
          }),
        }).catch(e => console.error("FAILED TO ADD EVENT:", e))
      }

      let widgets: Widget[] | undefined
      let displayText = text

      // If the AI returned search intents, fetch place cards from the search API
      // and then persist them alongside the assistant message so they reload on refresh.
      if (intents?.length) {
        const tripLocation =
          (trip as any).location ||
          (trip as any).destination ||
          ""

        console.log("TRIP LOCATION:", tripLocation)

        try {
          console.log("CALLING SEARCH...")
          const searchRes = await fetch("/api/ai/suggestions/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intents, trip }),
          })
          console.log("SEARCH STATUS:", searchRes.status)

          if (searchRes.ok) {
            const { widgets: real, fallback } = await searchRes.json()
            console.log("SEARCH RESULT:", real?.length, "widgets")

            if (real?.length) {
              widgets = real

              try {
                // Wait briefly for the assistant message to be persisted to the DB
                // before fetching back its ID to associate the widgets with it.
                await new Promise(resolve => setTimeout(resolve, 500))

                const historyRes = await fetch(`/api/ai/chat?itineraryId=${trip.id}`)
                if (historyRes.ok) {
                  const { messages: dbMessages } = await historyRes.json()

                  const lastAssistant = [...dbMessages]
                    .reverse()
                    .find((m: any) => m.role === "assistant")

                  console.log("LAST ASSISTANT MSG ID:", lastAssistant?.id)

                  if (lastAssistant?.id) {
                    await fetch("/api/ai/suggestions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        itineraryId: trip.id,
                        content: JSON.stringify(real),
                        messageId: lastAssistant.id,
                      }),
                    })
                    console.log("WIDGETS SAVED WITH MESSAGE ID:", lastAssistant.id)
                  } else {
                    console.warn("NO ASSISTANT MESSAGE FOUND — widgets not saved")
                  }
                }
              } catch (e) {
                console.error("FAILED TO SAVE WIDGETS:", e)
              }

            } else if (fallback) {
              // Use the AI-generated fallback text when the search returns no results
              displayText = fallback
              console.log("USING FALLBACK:", fallback)
            }
          }
        } catch (e) {
          console.error("SEARCH CALL FAILED:", e)
        }
      }

      // Finalize the bot message with the clean display text and any place card widgets
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, text: displayText, widgets }
            : m
        )
      )

    } catch {
      // Remove the optimistic bot message placeholder if the request failed entirely
      if (botMsgAdded) {
        setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, trip, isLoading]);

  // Handles PDF file uploads by sending the file to the parse-pdf endpoint,
  // which uses Claude to extract structured event data from the document.
  const handlePdfUpload = useCallback(async (file: File) => {
    if (isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      text: `[PDF: ${file.name}]`,
      sender: "user",
      timestamp: new Date(),
    }
    const botMsgId = crypto.randomUUID()

    // Show a placeholder bot message immediately while the PDF is being processed
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: botMsgId, text: "Reading your PDF…", sender: "bot", timestamp: new Date() },
    ])
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("itineraryId", trip.id)

      const res = await fetch("/api/ai/parse-pdf", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(error ?? "Failed to parse PDF")
      }

      const pdfEvent: PdfEventData = await res.json()

      // Replace the placeholder with the extracted event data for the user to review
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, text: "I found an event in your PDF. Here are the details:", pdfEvent }
            : m
        )
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sorry, I couldn't extract event info from that PDF."
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, text: msg } : m))
      )
    } finally {
      setIsLoading(false)
    }
  }, [trip.id, isLoading])

  // Used by external components to inject a bot message without a user prompt,
  // for example after the user adds a PDF event to the itinerary.
  const addBotMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, sender: "bot", timestamp: new Date() },
    ])
  }, [])

  return { isCollapsed, toggle, messages, input, setInput, sendMessage, handlePdfUpload, addBotMessage, isLoading };
}
