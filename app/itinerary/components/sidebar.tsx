import React, { useRef, useEffect, KeyboardEvent } from "react";
import { chat } from "./chat";
import { Message, Trip, Widget } from "../types/types";
import styles from "../../../styles/chat.module.css";
import ReactMarkdown from "react-markdown";
import { EventWidget } from "./EventWidget";
import { Day } from "../day";
import { useBookmarks } from "./useBookmarks";
import {Compass} from "lucide-react"

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

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ trip, days }) => {
  const { isCollapsed, toggle, messages, input, setInput, sendMessage, isLoading } =
    chat(trip);
  const messagesRef = useRef<HTMLDivElement>(null)
  const { isBookmarked, toggleBookmark, refetch } = useBookmarks(trip.id)
  const prevMessageCount = useRef(messages.length);
  const lastMessageText = messages[messages.length - 1]?.text ?? "";
  

  useEffect(() => {
    refetch()
  }, [messages, refetch])

  const scrollToBottom = (behavior: ScrollBehavior) => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length !== prevMessageCount.current) {
      prevMessageCount.current = messages.length;
      scrollToBottom("smooth");
    }
  }, [messages.length]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom("instant");
    }
  }, [lastMessageText, isLoading]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => (
    <div className={`${styles.msg} ${styles[msg.sender]}`}>
      {msg.text && (
        <div className={styles.markdownBody}>
          <ReactMarkdown>{msg.text}</ReactMarkdown>
        </div>
      )}
      {msg.widgets?.map((widget) => (
        <EventWidget
          key={widget.id}
          widget={widget}
          tripId={trip.id}
          days={days}
          isBookmarked={isBookmarked(widget.title, widget.location)}
          onToggleBookmark={toggleBookmark}
        />
      ))}
  
    </div>
  );

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="Chat sidebar"
    >
      {/* Header */}
      <header className={styles.header}>
        {!isCollapsed && <div  className={styles.title}><Compass /><span className="px-3">Agent Atlas</span></div>}
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
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            
            {isLoading && (
              <div className={`${styles.msg} ${styles.bot}`} style={{ opacity: 0.6, fontStyle: "italic" }}>
                <span>Atlas is typing…</span>
              </div>
            )}
            
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