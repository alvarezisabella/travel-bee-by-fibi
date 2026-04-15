import { useState } from "react";
import { Widget, LABEL_MAP } from "../types/types";
import { X, Loader2, Check } from "lucide-react";
import { Day } from "../day";
import { createClient } from "@/lib/supabase/client";
import { insertEvent } from "@/lib/supabase/event";
import w from "@/styles/widgets.module.css";
import styles from "@/styles/bookmarkcard.module.css";

export function BookmarkCard({ idea, tripId, days, onAdded, onDelete }: {
  idea: Widget
  tripId: string
  days: Day[]
  onAdded: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const bannerColor = LABEL_MAP[idea.type as keyof typeof LABEL_MAP]?.bar ?? "#9ca3af";

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
        title: idea.title,
        description: idea.description ?? "",
        type: "Activity",
        status: "Pending",
        created_by: user.id,
      });

      if (error) throw new Error(error.message);

      window.dispatchEvent(new CustomEvent("bookmark-added", {
        detail: {
          id: data.id,
          itineraryid: tripId,
          dayid: days.find(d => d.date === selectedDay)?.id,
          title: idea.title,
          description: idea.description ?? "",
          status: "Pending",
          startTime: "",
          duration: 0,
          location: "",
          travelers: "",
          type: "Activity",
          upvotes: 0,
          downvotes: 0,
        }
      }));

      setAdded(true);
      setTimeout(() => {
        setOpen(false);
        setAdded(false);
        setSelectedDay(null);
        onAdded();
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
          {idea.image_url && (
            <img src={idea.image_url} className={w.bannerImg} alt={idea.title} />
          )}
          {idea.type && (
            <div className={w.bannerBadge}>
              <span className={w.bannerBadgeText}>{idea.type}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className={w.body}>
          <p className={w.title}>{idea.title}</p>
          {idea.description && (
            <p className={w.description}>{idea.description}</p>
          )}
          {idea.location && (
            <p className={w.location}>{idea.location}</p>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={w.deleteBtn}
        >
          <X size={12} className={w.deleteBtnIcon} />
        </button>

      </div>

      {/* Detail modal */}
      {open && (
        <div className={styles.modal}>

          <div className={styles.modalHandle}>
            <div className={styles.modalHandleBar} />
          </div>

          <div className={styles.modalBody}>

            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{idea.title}</h3>
                {idea.location && (
                  <p className={styles.modalLocation}>{idea.location}</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Description */}
            {idea.description && (
              <p className={styles.modalDescription}>{idea.description}</p>
            )}

            {/* Day picker */}
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

            {/* Add button */}
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
}