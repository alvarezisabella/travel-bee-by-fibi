import { ThumbsUp, ThumbsDown } from "lucide-react"
import { Event, EventLabel, EventStatus, cardColor, STATUS_MAP, LABEL_MAP } from "@/app/itinerary/types/types";


interface EventProp {
    event: Event;
}
export function ShowEvent({event}: EventProp) {
    const colors = LABEL_MAP[event.type];
    const status_bg = STATUS_MAP[event.status]

    return (
    <div
        className={`w-full h-full flex gap-4 ${cardColor.bg} transition-shadow`}
    >
        <div className={`w-1 rounded-full ${cardColor.bar} flex-shrink-0`} />

        <div 
        style={{fontFamily:"Helvetica"}}
        className={`absolute top-3 right-8 max-w-24 rounded-xl ${status_bg} shadow-sm items-center justify-center`}>
        <h4 className="px-2 py-1 text-white text-xs">{event.status}</h4>
        </div>

        {/*Event Title*/}
        <div className="flex-1 min-w-0">
        <div className="items-start justify-between gap-2">
            <h4 className={`font-medium text-md ${cardColor.text} truncate mt-1`} style={{ fontFamily: "Helvetica, serif" }}>
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

        <div className={`flex items-center gap-1.5 mt-2 text-xs ${cardColor.time}`}>
            <span>{event.startTime}</span>
            <span className="opacity-40">·</span>
            <span>{event.duration}</span>
        </div>

        </div>
    </div>
  </div>
    );
}