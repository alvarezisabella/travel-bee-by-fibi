import React, { useRef, useEffect, KeyboardEvent } from "react";
import { chat } from "./chat";
import { Message, Trip, Widget } from "../types/types";
import styles from "../../../styles/chat.module.css";
import ReactMarkdown from "react-markdown";
import { EventWidget } from "./EventWidget";
import { Day } from "../day";
import { useBookmarks } from "./useBookmarks";

const ChevronIcon: React.FC<{ flipped: boolean }> = ({ flipped }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    style={{ transform: flipped ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}
  >
    <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

interface ChatSidebarProps {
  trip: Trip;
  days: Day[];
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ trip, days }) => {
  const { isCollapsed, toggle, messages, input, setInput, sendMessage, isLoading } =
    chat(trip);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isBookmarked, toggleBookmark, refetch } = useBookmarks(trip.id)

  useEffect(() => {
    refetch()
  }, [messages, refetch])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
    // Safety strip — ensures raw <widgets> block never renders even if
    // parseWidgets hasn't run yet or returned early due to a parse error
    const displayText = msg.text
      ?.replace(/<widgets>\s*[\s\S]*?\s*<\/widgets>/, "")
      .replace(/<widgets>[\s\S]*$/, "")
      .replace(/<search>\s*[\s\S]*?\s*<\/search>/, "")  // ← add this
      .replace(/<search>[\s\S]*$/, "")  
      .trim()

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
            onToggleBookmark={toggleBookmark}
          />
        ))}
        <time className={styles.timestamp}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </time>
      </div>
    )
  }

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="Chat sidebar"
    >
      {/* Header */}
      <header className={styles.header}>
        {!isCollapsed && <span className={styles.title}>Agent Atlas</span>}
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
          <div className={styles.messages} role="log" aria-live="polite">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && (
              <div className={`${styles.msg} ${styles.bot}`} style={{ opacity: 0.6, fontStyle: "italic" }}>
                <span>Atlas is typing…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
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