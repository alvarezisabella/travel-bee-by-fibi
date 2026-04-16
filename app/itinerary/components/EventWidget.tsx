//app/itinerary/components/EventWidget.tsx

import { Widget, LABEL_MAP, Message } from "../types/types";
import React from "react";
import ReactMarkdown from "react-markdown";
import w from "@/styles/widgets.module.css";
import styles from "../../../styles/chat.module.css";

export const EventWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const bannerColor = LABEL_MAP[widget.type]?.bar ?? "#9ca3af";

  return (
    <div className={w.card}>

      {/* Banner */}
      <div className={w.banner} style={{ backgroundColor: bannerColor }}>
        {widget.image_url && (
          <img src={widget.image_url} className={w.bannerImg} alt={widget.title} />
        )}
        {widget.type && (
          <div className={w.bannerBadge}>
            <span className={w.bannerBadgeText}>{widget.type}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className={w.body}>
        <p className={w.title}>{widget.title}</p>
        {widget.description && (
          <p className={w.description}>{widget.description}</p>
        )}
        {widget.location && (
          <p className={w.location}>{widget.location}</p>
        )}

        {/* Footer — rating/price, EventWidget only */}
        {(widget.rating !== undefined || widget.price !== undefined) && (
          <div className={w.footer}>
            {widget.rating !== undefined && (
              <span className={w.rating}>★ {widget.rating}</span>
            )}
            {widget.price !== undefined && (
              <span className={w.price}>
                {widget.price === 0 ? "Free" : `$${widget.price.toLocaleString()}`}
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};