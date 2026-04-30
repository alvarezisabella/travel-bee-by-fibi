"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function Chatwidget() {
  const [open, setOpen] = useState(false); // controls panel
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMessage }),
      });

      let botMessage = "";

      // Create empty bot message for streaming
      setMessages((prev) => [...prev, { role: "bot", text: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        botMessage += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            text: botMessage,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }

    setIsTyping(false);
  };

  return (
    <>
      {/* ================= FLOATING BUTTON ================= */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 hover:bg-blue-700 transition"
        >
          💬
        </button>
      )}

      {/* ================= OVERLAY (optional dark background) ================= */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)} // click outside closes
        />
      )}

      {/* ================= HALF SCREEN PANEL ================= */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-1/2 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center bg-blue-600 text-white p-4">
          <h2 className="font-semibold">Agent Atlas</h2>

          {/* CLOSE BUTTON */}
          <button onClick={() => setOpen(false)} className="text-xl">
            ✕
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 h-[calc(100%-120px)]">
          {messages.length === 0 && (
            <p className="text-gray-400">
              Ask me anything about your trip ✈️
            </p>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded max-w-[75%] ${
                msg.role === "user"
                  ? "bg-blue-100 ml-auto text-right"
                  : "bg-gray-100"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="bg-gray-100 p-2 rounded w-fit animate-pulse">
              Typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="p-4 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}