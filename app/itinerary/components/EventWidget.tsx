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
  onRemoveBookmark: (widget: Widget) => void;
  onAddBookmark: (widget: Widget, day: string) => void;
}

function extractHex(twClass: string): string {
  const match = twClass.match(/#([0-9a-fA-F]{3,6})/)
  return match ? `#${match[1]}` : "#e5e7eb"
}

export const EventWidget: React.FC<EventWidgetProps> = ({
  widget, tripId, days, isBookmarked, onRemoveBookmark, onAddBookmark
}) => {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [added, setAdded] = useState(false);
  const [savedBookmark, setSavedBookmark] = useState(false);
  const bannerColor = extractHex(LABEL_MAP[widget.type]?.bar ?? "")

  function handleBookmarkClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (isBookmarked) {
      onRemoveBookmark(widget)
    } else {
      setOpen(true) // must pick a day to save
    }
  }

  function handleSaveBookmark() {
    if (!selectedDay?.date) return;
    onAddBookmark(widget, selectedDay.date)
    setSavedBookmark(true)
    setTimeout(() => { setOpen(false); setSavedBookmark(false); setSelectedDay(null) }, 800)
  }

  function handleTicketLink(e: React.MouseEvent) {
    e.stopPropagation()
    if (widget.url) window.open(widget.url, "_blank", "noopener,noreferrer")
  }

  async function handleAdd() {
    if (!selectedDay?.date) return;
    setAdding(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data, error } = await insertEvent(supabase, {
        itinerary_id: tripId,
        day: selectedDay.date,
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
          dayid: selectedDay.id,
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
      <div className={w.card} onClick={() => setOpen(o => !o)}>
        <div className={w.banner} style={{ backgroundColor: bannerColor }}>
          {widget.image_url && <img src={widget.image_url} className={w.bannerImg} alt={widget.title} />}
          {widget.type && (
            <div className={w.bannerBadge}><span className={w.bannerBadgeText}>{widget.type}</span></div>
          )}
        </div>

        <div className={w.body}>
          <p className={w.title}>{widget.title}</p>
          {widget.description && <p className={w.description}>{widget.description}</p>}
          {widget.location && <p className={w.location}>{widget.location}</p>}
          <div className={w.footer}>
            {widget.rating !== undefined && <span className={w.rating}>★ {widget.rating}</span>}
            {widget.price !== undefined && (
              <span className={w.price}>{widget.price === 0 ? "Free" : `$${widget.price.toLocaleString()}`}</span>
            )}
          </div>
          <div className={w.link} onClick={handleTicketLink}>
            {widget.url && (widget.type === "Reservation" || widget.type === "Transit") && (
              <button onClick={handleTicketLink} className={w.ticketLink} aria-label="Buy tickets">
                <ExternalLink size={11} />
                <span>{widget.type === "Transit" ? "Book flight" : "Tickets"}</span>
              </button>
            )}
          </div>
        </div>

        <button onClick={handleBookmarkClick} className={w.deleteBtn} aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}>
          <Bookmark size={12} fill={isBookmarked ? "#000000" : "none"} stroke={isBookmarked ? "#000000" : "currentColor"} />
        </button>
      </div>

      {open && (
        <div className={styles.modal}>
          <div className={styles.modalHandle}><div className={styles.modalHandleBar} /></div>

          <div className={styles.modalBody}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{widget.title}</h3>
                {widget.location && <p className={styles.modalLocation}>{widget.location}</p>}
              </div>
              <button onClick={() => setOpen(false)} className={styles.modalCloseBtn}><X size={18} /></button>
            </div>

            {widget.description && <p className={styles.modalDescription}>{widget.description}</p>}

            <div className={w.footer}>
              {widget.rating !== undefined && <span className={w.rating}>★ {widget.rating}</span>}
              {widget.price !== undefined && (
                <span className={w.price}>{widget.price === 0 ? "Free" : `$${widget.price.toLocaleString()}`}</span>
              )}
            </div>

            {widget.url && (widget.type === "Reservation" || widget.type === "Transit") && (
              <button onClick={handleTicketLink} className={styles.ticketBtn} aria-label="Buy tickets">
                <ExternalLink size={14} />
                <span>{widget.type === "Transit" ? "Book on Google Flights" : "Buy Tickets"}</span>
              </button>
            )}

            <div className={styles.dayPicker}>
              <p className={styles.dayPickerLabel}>Choose a day</p>
              <div className={styles.dayPickerScroll}>
                {days.map((day, index) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day)}
                    className={`${styles.dayBtn} ${selectedDay?.id === day.id ? styles.dayBtnSelected : ""}`}
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

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSaveBookmark}
                disabled={!selectedDay || savedBookmark}
                className={styles.addBtn}
              >
                {savedBookmark ? <><Check size={14} /> Saved!</> : "Save bookmark"}
              </button>
              <button
                onClick={handleAdd}
                disabled={adding || !selectedDay || added}
                className={styles.addBtn}
              >
                {added ? <><Check size={14} /> Added!</> : adding ? <><Loader2 size={14} className={styles.spinner} /> Adding...</> : "Add to itinerary"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};