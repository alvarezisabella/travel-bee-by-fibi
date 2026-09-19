import { Dot, Clock, MapPin } from "lucide-react";
import { Event, cardColor, STATUS_MAP, LABEL_MAP } from "@/app/itinerary/types/types";

function formatTime(time: string): string {
  if (!time) return ""
  const [h, m] = time.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return time
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${period}`
}

function formatDuration(minutes: number): string {
  if (!minutes) return ""
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}


interface EventProp {
    event: Event;
}
export function ShowEvent({event}: EventProp) {
    const colors = LABEL_MAP[event.type];
    const status_bg = STATUS_MAP[event.status]

    return (
    <div className={`w-full flex gap-3 ${cardColor.bg} py-1`}>

        <div style={{"--bg": status_bg.bg} as React.CSSProperties}
  className={`w-1 rounded-full bg-[rgb(var(--bg)/0.3)] flex-shrink-0 self-stretch`} />

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">

            {/*Event Title & Status*/}
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-[16px] leading-snug text-primary tracking-tight">
                {event.title}
                </h4>

                <span
                style={{"--bg": status_bg.bg} as React.CSSProperties}
                className={`flex flex-shrink-0 items-center gap-1 text-[11px] ${status_bg.dot} font-extrabold px-2 py-0.5 rounded-full bg-[rgb(var(--bg)/0.3)] whitespace-nowrap`}>
                <Dot size={14}/> {event.status}
                </span>
            </div>

            <div className={`w-fit max-w-full rounded-sm px-1.5 py-0.5 ${colors.bg}`}>
            <h4 className={`text-xs ${colors.text} truncate`}>{event.type}</h4>
            </div>

            {event.description && (
                <p className={`text-xs ${cardColor.time} opacity-80 line-clamp-3 whitespace-pre-wrap`} style={{ fontFamily: "Georgia, serif" }}>
                {event.description}
                </p>
            )}

            {event.location && (
                <div className={`flex items-center gap-1 min-w-0 text-[12px] ${cardColor.time} opacity-80`}>
                    <MapPin size={13} className="flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                </div>
            )}

            {/*Time & Duration */}
            <div className="flex items-center gap-1.5 text-[12px] text-tertiary">
            <Clock size={14}/>
            <span>{formatTime(event.startTime)}</span>
            {event.duration > 0 && (
                <>
                <span className="opacity-80">·</span>
                <span>{formatDuration(event.duration)}</span>
                </>
            )}
            </div>

        </div>
    </div>
    );
}
