// app/itinerary/components/chat.ts

import { useState, useCallback, useEffect } from "react";
import { Message, Widget } from "../types/types";
import { Trip } from "../types/types";
import { ChatMessage } from "@/lib/ai/types";

// chat.ts — replace parseWidgets with this

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

function stripSearchBlock(text: string): string {
  return text
    .replace(/<search>\s*[\s\S]*?\s*<\/search>/, "")
    .replace(/<search>[\s\S]*$/, "")
    .trim()
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
          // Parse widgets from persisted messages too so they
          // render correctly when chat history is reloaded
          const { text, intents } = parseSearch(m.content);
          return {
            id: m.id,
            text,
            intents,
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

        // Strip the widget block from what's displayed mid-stream —
        // partial JSON would show as raw text otherwise
        const displayText = stripSearchBlock(botText);

        // Stream raw text into the bubble as it arrives —
        // widgets are parsed only once the stream is complete
        if (!botMsgAdded) {
          setMessages((prev) => [
            ...prev,
            { id: botMsgId, text: displayText, sender: "bot", timestamp: new Date() },
          ]);
          botMsgAdded = true;
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: displayText } : m))
          );
        }
      }

      const { text, intents } = parseSearch(botText)
      console.log("PARSED TEXT:", text)
      console.log("PARSED INTENTS:", intents?.length)

      let widgets: Widget[] | undefined

      if (intents?.length) {
        const tripLocation = (trip as any).location || (trip as any).destination || ""
        console.log("TRIP LOCATION:", tripLocation)

        try {
          const searchRes = await fetch("/api/ai/suggestions/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intents }),
          })
          console.log("SEARCH STATUS:", searchRes.status)
          if (searchRes.ok) {
            const { widgets: real } = await searchRes.json()
            console.log("SEARCH RESULT:", real?.length, "widgets")
            widgets = real
          }
        } catch (e) {
          console.error("SEARCH CALL FAILED:", e)
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId ? { ...m, text, widgets } : m
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

  return { isCollapsed, toggle, messages, input, setInput, sendMessage, isLoading };
}