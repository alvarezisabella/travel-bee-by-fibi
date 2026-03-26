import { Event } from "../event"

interface DayWithDate {
  id: string
  date: string
  events: Event[]
}

interface CalendarGridProps {
  days: DayWithDate[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 80

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

  const getEventPosition = (event: Event) => {
    const [h, m] = event.startTime.split(":").map(Number)
    const start = h * 60 + m
    const end = start + event.duration

    return {
      top: (start / 60) * HOUR_HEIGHT,
      height: ((end - start) / 60) * HOUR_HEIGHT,
    }
  }

  return (
    <div className="w-full overflow-x-auto">

      {/* 🔥 MAIN GRID */}
      <div
        className="grid border bg-white"
        style={{
          gridTemplateColumns: `80px repeat(${days.length}, minmax(140px, 1fr))`,
          gridTemplateRows: `60px repeat(24, ${HOUR_HEIGHT}px)`,
        }}
      >

        {/* Empty corner */}
        <div />

        {/* Day headers */}
        {days.map((day) => (
          <div
            key={day.id}
            className="border-b text-center font-medium text-sm py-2 bg-gray-50"
          >
            {formatDayHeader(day.date)}
          </div>
        ))}

        {/* Time labels + grid cells */}
        {HOURS.map((hour) => (
          <>
            {/* Time column */}
            <div
              key={`time-${hour}`}
              className="border-t text-xs text-gray-500 p-2"
            >
              {formatHour(hour)}
            </div>

            {/* Day columns */}
            {days.map((day) => (
              <div
                key={`${day.id}-${hour}`}
                className="border-t border-l"
              />
            ))}
          </>
        ))}

        {/* 🔥 EVENTS LAYER */}
        {days.map((day, index) => (
          <div
            key={`events-${day.id}`}
            className="relative"
            style={{
              gridColumn: index + 2,
              gridRow: "2 / span 24",
            }}
          >
            {day.events.map((event) => {
              const { top, height } = getEventPosition(event)

              return (
                <div
                  key={event.id}
                  className="absolute left-1 right-1 rounded-md p-2 text-xs shadow-sm"
                  style={{
                    top,
                    height,
                    backgroundColor: getEventColor(event.type),
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-[10px] opacity-70">
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

/* 🎨 Colors */
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