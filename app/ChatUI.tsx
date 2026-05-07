"use client"; // REQUIRED (this component uses state)

import { useState } from "react";
//import { getAIResponse } from "@/lib/ai/anthropic"; //

type Message = {
  role: "user" | "agent";
  text: string;
};

export default function ChatUI({
  compact = false,   //  NEW: controls size (landing vs full page)
}: {
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: "Hi! I'm Agent Atlas, your AI travel assistant. Ask me anything about your next trip! ✈️" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const currentInput = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: currentInput }]);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = [
        ...messages.map(m => ({
          role: m.role === "user" ? "user" as const : "assistant" as const,
          content: m.text,
        })),
        { role: "user" as const, content: currentInput },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      let botText = "";
      setMessages((prev) => [...prev, { role: "agent", text: "" }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          botText += decoder.decode(value);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "agent", text: botText };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Error getting response." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div
      className={`
        border-4 border-blue-500 rounded-2xl overflow-hidden bg-white shadow-lg flex flex-col
        ${compact ? "w-full max-w-[600px] h-[500px]" : "w-full h-screen"}
      `}
    >

      {/* HEADER (UNCHANGED DESIGN) */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-400">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-300">
          🤖
        </div>
        <div>
          <p className="font-semibold text-sm">Agent Atlas</p>
          <p className="text-xs text-gray-700">AI Travel Assistant</p>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 bg-gray-200 p-4 space-y-4 overflow-y-auto">

        {/*  MESSAGES LOOP */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 ${
              msg.role === "user" ? "justify-end" : ""
            }`}
          >
            {msg.role === "agent" && (
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-300">
                🤖
              </div>
            )}

            <div
              className={`px-4 py-2 max-w-[70%] text-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                  : "bg-gray-100 rounded-2xl rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-400">
                👤
              </div>
            )}
          </div>
        ))}

        {/*  LOADING STATE */}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-300">
              🤖
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm">
              Typing...
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="flex items-center gap-2 p-3 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Agent Atlas anything..."
          className="flex-1 px-4 py-2 rounded-full border focus:outline-none text-sm"
        />
        <button
          onClick={sendMessage}
          className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-full text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}