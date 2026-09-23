// DayPicker.tsx
import { Day } from "../day";
import styles from "@/styles/bookmarkcard.module.css";

interface DayPickerProps {
  days: Day[];
  selectedDayId: string | null;
  onSelect: (day: Day) => void;
  allowUnsorted?: boolean;
  onSelectUnsorted?: () => void;
  label?: string;
}

export function DayPicker({
  days, selectedDayId, onSelect, allowUnsorted, onSelectUnsorted, label = "Add to day"
}: DayPickerProps) {
  return (
    <div className={styles.dayPicker}>
      <p className={styles.dayPickerLabel}>{label}</p>
      <div className={styles.dayPickerScroll}>
        {allowUnsorted && (
          <button
            onClick={onSelectUnsorted}
            className={`${styles.dayBtn} ${selectedDayId === null ? styles.dayBtnSelected : ""}`}
          >
            <span className={styles.dayBtnLabel}>No day yet</span>
          </button>
        )}
        {days.map((day, index) => (
          <button
            key={day.id}
            onClick={() => onSelect(day)}
            className={`${styles.dayBtn} ${selectedDayId === day.id ? styles.dayBtnSelected : ""}`}
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
  );
}