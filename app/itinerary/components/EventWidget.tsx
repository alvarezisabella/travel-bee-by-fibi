import { Widget, LABEL_MAP } from "../types/types";
import React, { useState } from "react";
import { Check, Loader2, Bookmark, X, ExternalLink } from "lucide-react";
import { Day } from "../day";
import { createClient } from "@/lib/supabase/client";
import { insertEvent } from "@/lib/supabase/event";
import w from "@/styles/widgets.module.css";
import styles from "@/styles/bookmarkcard.module.css";

interface EventWidgetProps {
  widget: Widget;
  tripId: string;
  days: Day[];
  isBookmarked: boolean;
  onToggleBookmark: (widget: Widget) => void;
}

function extractHex(twClass: string): string {
  const match = twClass.match(/#([0-9a-fA-F]{3,6})/)
  return match ? `#${match[1]}` : "#e5e7eb"
}

export const EventWidget: React.FC<EventWidgetProps> = ({
  widget, tripId, days, isBookmarked, onToggleBookmark
}) => {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const bannerColor = extractHex(LABEL_MAP[widget.type]?.bar ?? "")

  function handleBookmarkToggle(e: React.MouseEvent) {
    e.stopPropagation()
    onToggleBookmark(widget)
  }

  function handleTicketLink(e: React.MouseEvent) {
    e.stopPropagation()
    if (widget.url) window.open(widget.url, "_blank", "noopener,noreferrer")
  }

  async function handleAdd() {
    if (!selectedDay) return;
    setAdding(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data, error } = await insertEvent(supabase, {
        itinerary_id: tripId,
        day: selectedDay,
        title: widget.title,
        description: widget.description ?? "",
        type: widget.type,
        status: "Pending",
        created_by: user.id,
      });

      if (error) throw new Error(error.message);

      window.dispatchEvent(new CustomEvent("bookmark-added", {
        detail: {
          id: data.id,
          itineraryid: tripId,
          dayid: days.find(d => d.date === selectedDay)?.id,
          title: widget.title,
          description: widget.description ?? "",
          status: "Pending",
          startTime: "",
          duration: 0,
          location: widget.location ?? "",
          travelers: "",
          type: widget.type,
          upvotes: 0,
          downvotes: 0,
        }
      }));

      setAdded(true);
      setTimeout(() => {
        setOpen(false);
        setAdded(false);
        setSelectedDay(null);
      }, 1000);
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      {/* Card */}
      <div className={w.card} onClick={() => setOpen(o => !o)}>

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
          <div className={w.link} onClick={handleTicketLink}>
          {/* Ticket link inline on card — only for Reservation type */}
            {widget.url && widget.type === "Reservation" || widget.type === "Transit" && (
              <button
                onClick={handleTicketLink}
                className={w.ticketLink}
                aria-label="Buy tickets"
              >
                <ExternalLink size={11} />
                
                <span>Tickets</span>
              </button>
            )}
          </div>
        </div>

        {/* Bookmark button */}
        <button
          onClick={handleBookmarkToggle}
          className={w.deleteBtn}
          aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
        >
          <Bookmark
            size={12}
            fill={isBookmarked ? "#000000" : "none"}
            stroke={isBookmarked ? "#000000" : "currentColor"}
          />
        </button>

      </div>

      {/* Detail modal */}
      {open && (
        <div className={styles.modal}>
          <div className={styles.modalHandle}>
            <div className={styles.modalHandleBar} />
          </div>

          <div className={styles.modalBody}>

            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{widget.title}</h3>
                {widget.location && (
                  <p className={styles.modalLocation}>{widget.location}</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            {widget.description && (
              <p className={styles.modalDescription}>{widget.description}</p>
            )}

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

            {/* Ticket link in modal — full button for Reservation type */}
            {widget.url && widget.type === "Reservation" || widget.type === "Transit" && (
              <button
                onClick={handleTicketLink}
                className={styles.ticketBtn}
                aria-label="Buy tickets"
              >
                <ExternalLink size={14} />
                <span>Buy Tickets</span>
              </button>
            )}

            <div className={styles.dayPicker}>
              <p className={styles.dayPickerLabel}>Add to day</p>
              <div className={styles.dayPickerScroll}>
                {days.map((day, index) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.date ?? null)}
                    className={`${styles.dayBtn} ${selectedDay === day.date ? styles.dayBtnSelected : ""}`}
                  >
                    <span className={styles.dayBtnLabel}>Day {index + 1}</span>
                    {day.date && (
                      <span className={styles.dayBtnDate}>
                        {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={adding || !selectedDay || added}
              className={styles.addBtn}
            >
              {added
                ? <><Check size={14} /> Added!</>
                : adding
                ? <><Loader2 size={14} className={styles.spinner} /> Adding...</>
                : "Add to itinerary"
              }
            </button>

          </div>
        </div>
      )}
    </>
  );
};