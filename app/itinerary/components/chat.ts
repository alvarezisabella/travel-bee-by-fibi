import { useState, useCallback, useEffect } from "react";
import { Message, Widget } from "../types/types";
import { Trip } from "../types/types";
import { ChatMessage } from "@/lib/ai/types";

function parseWidgets(raw: string): { text: string; widgets?: Widget[] } {
  const match = raw.match(/<widgets>([\s\S]*?)<\/widgets>/);
  if (!match) return { text: raw };
  try {
    const widgets = JSON.parse(match[1]) as Widget[];
    const text = raw.replace(/<widgets>[\s\S]*?<\/widgets>/, "").trim();
    return { text, widgets };
  } catch {
    return { text: raw };
  }
}

// strips <widgets>...</widgets> from text shown during streaming
function stripWidgetBlock(text: string): string {
  return text
    // strip complete block
    .replace(/<widgets>[\s\S]*?<\/widgets>/, "")
    // strip incomplete block — from <widgets> to end of string
    .replace(/<widgets>[\s\S]*$/, "")
    .trim();
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
          const { text, widgets } = parseWidgets(m.content);
          return {
            id: m.id,
            text,
            widgets,
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
      ...messages.map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      })),
      { role: "user", content: currentInput },
    ];

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
        const displayText = stripWidgetBlock(botText);

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

      // Stream is done — now parse widgets out of the completed 
      console.log("RAW BOT TEXT:", botText);
      const { text, widgets } = parseWidgets(botText);
      console.log("PARSED TEXT:", text);
      console.log("PARSED WIDGETS:", widgets);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId ? { ...m, text, widgets } : m
        )
      );

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