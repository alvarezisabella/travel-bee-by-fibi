import { useState, useCallback, useEffect } from "react";
import { Message } from "../types/types";
import { Trip } from "../types/types";
import { ChatMessage } from "@/lib/ai/types";

export function chat(trip: Trip) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load persisted chat history when the component mounts
  useEffect(() => {
    async function loadHistory() {
      const res = await fetch(`/api/ai/chat?itineraryId=${trip.id}`);
      if (!res.ok) return;
      const { messages: dbMessages } = await res.json();
      // Convert DB rows to the UI Message shape
      const uiMessages: Message[] = dbMessages.map(
        (m: { id: string; role: string; content: string; created_at: string }) => ({
          id: m.id,
          text: m.content,
          sender: m.role === "user" ? "user" : "bot",
          timestamp: new Date(m.created_at),
        })
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

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    // Build the full conversation history in the format the API expects
    // (includes all previous messages + the new user message)
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

      // Stream the response — add the bot bubble only when the first chunk arrives
      // so the typing indicator is visible until actual text starts appearing
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botText += decoder.decode(value, { stream: true });

        if (!botMsgAdded) {
          setMessages((prev) => [
            ...prev,
            { id: botMsgId, text: botText, sender: "bot", timestamp: new Date() },
          ]);
          botMsgAdded = true;
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: botText } : m))
          );
        }
      }
    } catch {
      // Remove the bot bubble if something went wrong 
      if (botMsgAdded) {
        setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, trip, isLoading]);

  return { isCollapsed, toggle, messages, input, setInput, sendMessage, isLoading };
}
