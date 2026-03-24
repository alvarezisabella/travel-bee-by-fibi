import { Event } from "../event"

interface DayWithDate {
  id: string
  date: string // "2026-07-14"
  events: Event[]
}

interface CalendarGridProps {
  days: DayWithDate[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 80 // px per hour

export default function CalendarGrid({ days }: CalendarGridProps) {

  const formatHour = (hour: number) => {
    if (hour === 0) return "12AM"
    if (hour < 12) return `${hour}AM`
    if (hour === 12) return "12PM"
    return `${hour - 12}PM`
  }

  const formatDayHeader = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // 🔥 Normalize event times for easier math
  const getEventPosition = (event: Event) => {
    const [startH, startM] = event.startTime.split(":").map(Number)
    const startMinutes = startH * 60 + startM

    const endMinutes = startMinutes + event.duration

    return {
      top: (startMinutes / 60) * HOUR_HEIGHT,
      height: ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT,
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="grid grid-cols-[80px_repeat(7,minmax(140px,1fr))] border bg-white">

        {/* Empty corner */}
        <div />

        {/* Day headers */}
        {days.map((day) => (
          <div
            key={day.id}
            className="text-center border-b py-3 text-sm font-medium bg-gray-50"
          >
            {formatDayHeader(day.date)}
          </div>
        ))}

        {/* Time rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-t text-xs p-2 text-gray-500">
              {formatHour(hour)}
            </div>

            {days.map((day) => (
              <div
                key={`${day.id}-${hour}`}
                className="relative border-t border-l h-20"
              />
            ))}
          </div>
        ))}

        {/* 🔥 Render ALL events once per day (not per hour) */}
        {days.map((day) => (
          <div
            key={`events-${day.id}`}
            className="col-start-2 relative"
            style={{
              gridColumn: `span 1`,
              gridRow: `2 / span ${HOURS.length}`,
            }}
          >
            {day.events.map((event) => {
              const { top, height } = getEventPosition(event)

              return (
                <div
                  key={event.id}
                  className="absolute left-1 right-1 rounded-md p-2 text-xs shadow-sm overflow-hidden"
                  style={{
                    top,
                    height,
                    backgroundColor: getEventColor(event.type),
                  }}
                >
                  <div className="font-medium truncate">
                    {event.title}
                  </div>
                  <div className="opacity-70 text-[10px]">
                    {event.startTime}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

      </div>
    </div>
  )
}

/* 🎨 Event colors */
function getEventColor(type: string) {
  switch (type) {
    case "Activity":
      return "#a7d7a9"
    case "Transit":
      return "#a7c7e7"
    case "Reservation":
      return "#f7d794"
    case "Food":
      return "#f8a5c2"
    default:
      return "#dcdde1"
  }
}