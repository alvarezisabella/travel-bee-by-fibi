import { useState, useCallback, useEffect } from "react";
import { Message, Widget, PdfEventData } from "../types/types";
import { Trip } from "../types/types";
import { ChatMessage } from "@/lib/ai/types";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      const res = await fetch(`/api/ai/chat?itineraryId=${trip.id}`);
      if (!res.ok) return;
      const { messages: dbMessages } = await res.json();
      const uiMessages: Message[] = dbMessages.map(
        (m: { id: string; role: string; content: string; created_at: string }) => {
          // Parse widgets and pdf events from persisted messages so they
          // render correctly when chat history is reloaded
          const { text: searchText, intents } = parseSearch(m.content);
          const { text, pdfEvent } = parsePdfEvent(searchText);
          return {
            id: m.id,
            text,
            intents,
            pdfEvent,
            sender: m.role === "user" ? "user" : "bot",
            timestamp: new Date(m.created_at),
          };
        }
      );
      setMessages(uiMessages);
    }
    loadHistory();
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

    const chatMessages: ChatMessage[] = [
      ...messages.map((m) => {
        if (m.sender !== "bot") {
          return {
            role: "user" as const,
            content: m.text,
          }
        }

        // Reconstruct the full assistant message with widget JSON
        // so Claude sees its previous responses correctly in history
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botText += decoder.decode(value, { stream: true });

        // Stream raw text into the bubble as it arrives —
        // widgets are parsed only once the stream is complete
        if (!botMsgAdded) {
          setMessages((prev) => [
            ...prev,
            { id: botMsgId, text: "", sender: "bot", timestamp: new Date() },
          ]);
          botMsgAdded = true;
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: "" } : m))
          );
        }
      }

      const { text, intents } = parseSearch(botText)
      console.log("PARSED TEXT:", text)
      console.log("PARSED INTENTS:", intents?.length)

      let widgets: Widget[] | undefined
      let displayText = text

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
            body: JSON.stringify({ intents }),
          })
          console.log("SEARCH STATUS:", searchRes.status)

          if (searchRes.ok) {
            const { widgets: real, fallback } = await searchRes.json()
            console.log("SEARCH RESULT:", real?.length, "widgets")

            if (real?.length) {
              // Results found — use them
              widgets = real
            } else if (fallback) {
              // No results — show Claude's fallback message instead
              displayText = fallback
              console.log("USING FALLBACK:", fallback)
            }
          }
        } catch (e) {
          console.error("SEARCH CALL FAILED:", e)
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, text: displayText, widgets }
            : m
        )
      )

    } catch {
      if (botMsgAdded) {
        setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, trip, isLoading]);

  const handlePdfUpload = useCallback(async (file: File) => {
    if (isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      text: `[PDF: ${file.name}]`,
      sender: "user",
      timestamp: new Date(),
    }
    const botMsgId = crypto.randomUUID()
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

  const addBotMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, sender: "bot", timestamp: new Date() },
    ])
  }, [])

  return { isCollapsed, toggle, messages, input, setInput, sendMessage, handlePdfUpload, addBotMessage, isLoading };
}