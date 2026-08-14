import { Dot, Clock } from "lucide-react";
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
    <div className={`w-full h-full flex gap-4 ${cardColor.bg} transition-shadow py-1`}>
        
        <div style={{"--bg": status_bg.bg} as React.CSSProperties}
  className={`w-1 rounded-full bg-[rgb(var(--bg)/0.3)] flex-shrink-0 self-stretch`} />

        {/*Event Status*/}
        <span 
        style={{"--bg": status_bg.bg} as React.CSSProperties}
        className={`absolute top-4 right-6 flex items-center justify-center text-[13px] ${status_bg.dot} font-extrabold pr-3 py-0.5 rounded-full bg-[rgb(var(--bg)/0.3)] tracking-wide whitespace-nowrap shadow-md`}>
         <Dot size={30}/> {event.status}
        </span>

        {/*Event Title*/}
        <div className="flex-1 min-w-0">
        <div className="items-start justify-between gap-2">
            <h4 className="font-medium text-[20px] text-primary tracking-tight truncate">
            {event.title}
            </h4>

            <div className={`max-w-24 rounded-sm py-1 ${colors.bg} flex items-center justify-center mt-2`}>
            <h4 className={`text-xs ${colors.text} opacity-100`}>{event.type}</h4>
            </div>
            {event.description && (
                <p className={`text-xs mt-1 ${cardColor.time} opacity-80 whitespace-pre-wrap`} style={{ fontFamily: "Georgia, serif" }}>
                {event.description}
                </p>
            )}

        {/*Time & Duration */}
        <div className="flex items-center gap-1.5 text-[12px] text-tertiary shadow-sm rounded-xl p-2 w-1/2">
        <Clock size={15}/>
        <span className="pt-0.5">{formatTime(event.startTime)}</span>
        <span className="opacity-80 pt-0.5">·</span>
        <span className="pt-0.5">{formatDuration(event.duration)}</span>
      </div>
        

        </div>
    </div>
  </div>
    );
}
