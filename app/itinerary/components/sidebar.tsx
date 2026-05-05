import React, { useRef, useEffect, KeyboardEvent } from "react";
import { chat } from "./chat";
import { Message, Trip, Widget, ItineraryUpdate } from "../types/types";
import styles from "../../../styles/chat.module.css";
import ReactMarkdown from "react-markdown";
import { EventWidget } from "./EventWidget";
import { PdfEventWidget } from "./PdfEventWidget";
import { Paperclip } from "lucide-react";
import { Day } from "../day";
import { useBookmarks } from "./useBookmarks";
import {Compass} from "lucide-react"
import { TripUpdates } from "./get_updates";
import { getItineraryUpdates } from "@/lib/hooks/updates";

const ChevronIcon: React.FC<{ flipped: boolean }> = ({ flipped }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 14 14"
    style={{ transform: flipped ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}
  >
    <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface ChatSidebarProps {
  trip: Trip;
  days: Day[];
}


interface MessageBubbleProps {
  msg: Message;
  trip: Trip;
  days: Day[];
  isBookmarked: (title: string, location?: string) => boolean;
  onToggleBookmark: (widget: Widget) => void;
  addBotMessage: (text: string) => void;
}

// Defined at module scope so React can reuse instances across renders —
// avoids the remounting that would happen if this were defined inside ChatSidebar.
const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg, trip, days, isBookmarked, onToggleBookmark, addBotMessage,
}) => {
  const displayText = msg.text
    ?.replace(/<widgets>\s*[\s\S]*?\s*<\/widgets>/, "")
    .replace(/<widgets>[\s\S]*$/, "")
    .replace(/<search>\s*[\s\S]*?\s*<\/search>/, "")
    .replace(/<search>[\s\S]*$/, "")
    .trim();

  return (
    <div className={`${styles.msg} ${styles[msg.sender]}`}>
      {displayText && (
        <div className={styles.markdownBody}>
          <ReactMarkdown>{displayText}</ReactMarkdown>
        </div>
      )}
      {msg.widgets?.map((widget, idx) => (
        <EventWidget
          key={`${widget.id}-${idx}`}
          widget={widget}
          tripId={trip.id}
          days={days}
          isBookmarked={isBookmarked(widget.title, widget.location)}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
      {msg.pdfEvent && (
        <PdfEventWidget
          pdfEvent={msg.pdfEvent}
          tripId={trip.id}
          days={days}
          trip={trip}
          onAdded={(title) =>
            addBotMessage(`Done! I've added "${title}" to your itinerary. Is there anything else you'd like help with?`)
          }
        />
      )}
      <time className={styles.timestamp}>
        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </time>
    </div>
  );
};

export const  ChatSidebar: React.FC<ChatSidebarProps> = ({ trip, days }) => {

  const { isCollapsed, toggle, messages, input, setInput, sendMessage, handlePdfUpload, addBotMessage, isLoading } =
    chat(trip);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isBookmarked, toggleBookmark, refetch } = useBookmarks(trip.id);

  useEffect(() => {
    refetch();
  }, [messages, refetch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="Chat sidebar"
    >
      {/* Header */}
      <header className={styles.header}>
        {!isCollapsed && <div  className={styles.title}>🐝<span className="px-3">Agent Atlas</span></div>}
        <button
          className={styles.toggleBtn}
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
        >
          <ChevronIcon flipped={isCollapsed} />
        </button>
      </header>

      {/* Messages */}
      {!isCollapsed && (
        <>
        
          <div ref={messagesRef} className={styles.messages} role="log" aria-live="polite">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                trip={trip}
                days={days}
                isBookmarked={isBookmarked}
                onToggleBookmark={toggleBookmark}
                addBotMessage={addBotMessage}
              />
            ))}
            <TripUpdates trip={trip.id}/>
             {isLoading && ( <div className={`${styles.msg} ${styles.bot}`} style={{ opacity: 0.6, fontStyle: "italic" }}>
                <span>Atlas is typing…</span>
              </div>)}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfUpload(file);
                e.target.value = "";
              }}
            />
            <button
              className={styles.attachBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="Upload PDF"
              type="button"
            >
              <Paperclip size={15} />
            </button>
            <textarea
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              aria-label="Chat message input"
              disabled={isLoading}
            />
            <button
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
        </>
      )}
    </aside>
  );
};
