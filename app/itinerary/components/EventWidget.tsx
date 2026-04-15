import { Widget, LABEL_MAP, Message } from "../types/types";
import React from "react";
import ReactMarkdown from "react-markdown";


export const EventWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const style = LABEL_MAP[widget.type];
  return (
    <div className={styles.eventWidget}>
      {widget.image_url && <img src={widget.image_url} className={styles.eventImg} alt={widget.title} />}
      <div className={styles.eventBody}>
        <div className={styles.eventHeader}>
          <span className={styles.eventTitle}>{widget.title}</span>
          <span className={styles.eventBadge} style={{ background: style.bg, color: style.text }}>
            {style.icon} {widget.type}
          </span>
        </div>
        {widget.location && <p className={styles.eventMeta}>{widget.location}</p>}
        {widget.description && <p className={styles.eventDesc}>{widget.description}</p>}
        <div className={styles.eventFooter}>
          {widget.rating && <span className={styles.eventRating}>★ {widget.rating}</span>}
          {widget.price !== undefined && (
            <span className={styles.eventPrice}>
              {widget.price === 0 ? "Free" : `$${widget.price.toLocaleString()}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// In MessageBubble:
const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => (
  <div className={`${styles.msg} ${styles[msg.sender]}`}>
    {msg.text && (
      <div className={styles.markdownBody}>
        <ReactMarkdown>{msg.text}</ReactMarkdown>
      </div>
    )}
    {msg.widgets?.map((w) => <EventWidget key={w.id} widget={w} />)}
    <time className={styles.timestamp}>
      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </time>
  </div>
);