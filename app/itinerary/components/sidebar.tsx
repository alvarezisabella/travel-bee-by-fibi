import React, { useRef, useEffect, KeyboardEvent } from "react";
import { chat } from "./chat";
import { Message } from "../types/types";
import styles from "../../../styles/chat.module.css";

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

const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => (
  <div className={`${styles.msg} ${styles[msg.sender]}`}>
    <span>{msg.text}</span>
    <time className={styles.timestamp}>
      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </time>
  </div>
);

export const ChatSidebar: React.FC = () => {
  const { isCollapsed, toggle, messages, input, setInput, sendMessage } =
    chat();
  const bottomRef = useRef<HTMLDivElement>(null);

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
            />
            <button
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={!input.trim()}
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