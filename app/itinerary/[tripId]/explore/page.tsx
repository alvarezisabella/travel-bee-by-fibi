"use client"

import { useState } from "react"
import {
  BedDouble,
  CarFront,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  Ticket,
  Utensils,
  Check,
  X,
  ArrowLeft,
} from "lucide-react"
import {
  useParams,
  useRouter,
} from "next/navigation"
import type { Widget } from "@/app/itinerary/types/types"
import type { Day } from "@/app/itinerary/day"
import TripInfoBar, {
  type ExploreCategory,
} from "./components/TripInfoBar"
import { useExploreSearch } from "./useExploreSearch"
import { useTripDays } from "./components/useTripDays"
import { useBookmarks } from "@/app/itinerary/components/useBookmarks"
import { saveExploreSelection } from "./exploreSelection"

const CARD_GRID =
  "grid items-start gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"

const moods = [
  {
    title: "Food & culture",
    subtitle: "Taste the soul of your destination",
    image:
      "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Coast & calm",
    subtitle: "Relax and recharge",
    image:
      "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Nightlife",
    subtitle: "Sip, dance, and explore",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85",
  },
]

function SkeletonGrid() {
  return (
    <div className={CARD_GRID}>
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="aspect-[4/3] w-full bg-slate-100" />
          <div className="space-y-2 p-3.5">
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-full rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorBlock({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
      <p className="text-sm font-medium text-red-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 cursor-pointer rounded-xl bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
      >
        Try again
      </button>
    </div>
  )
}

function ResultCard({
  widget,
  category,
  saved,
  onHeartClick,
  onOpen,
}: {
  widget: Widget
  category: Exclude<ExploreCategory, "All">
  saved: boolean
  onHeartClick: () => void
  onOpen: () => void
}) {
  let price = ""
  let priceNote = ""

  if (typeof widget.price === "number") {
    if (category === "Dining") {
      if (widget.price === 0) {
        price = "Free"
      } else if (widget.price >= 1 && widget.price <= 4) {
        price = "$".repeat(widget.price)
      } else {
        price = `$${widget.price.toLocaleString()}`
      }
    } else {
      price = `$${widget.price.toLocaleString()}`
      if (category === "Stays") priceNote = "/ night"
      else if (category === "Transportation") priceNote = "/ ride"
      else priceNote = "/ person"
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {widget.image_url ? (
          <img
            src={widget.image_url}
            alt={widget.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-slate-100" />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onHeartClick()
          }}
          aria-label={saved ? `Remove ${widget.title} from saved items` : `Save ${widget.title}`}
          className="absolute right-2.5 top-2.5 cursor-pointer rounded-full bg-white/95 p-1.5 shadow-sm"
        >
          <Heart
            className={[
              "h-4 w-4",
              saved ? "fill-amber-400 text-amber-400" : "text-slate-700",
            ].join(" ")}
          />
        </button>

        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {category}
        </span>
      </div>

      <div className="p-3.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{widget.title}</h3>

        <p className="mt-1 line-clamp-1 min-h-5 text-sm text-slate-500">
          {[widget.description, widget.location].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2">
          {typeof widget.rating === "number" ? (
            <span className="flex items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {widget.rating.toFixed(1)}
            </span>
          ) : (
            <span />
          )}

          {price && (
            <span className="text-sm font-bold text-slate-900">
              {price}
              {priceNote && <small className="ml-1 font-normal text-slate-500">{priceNote}</small>}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function BookmarkToast({
  dayLabel,
  onChange,
  onDismiss,
}: {
  dayLabel: string
  onChange: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
      <Check className="h-4 w-4 flex-shrink-0 text-amber-400" />
      <span>Saved to {dayLabel}</span>
      <button
        onClick={onChange}
        className="cursor-pointer font-semibold text-amber-400 underline-offset-2 hover:underline"
      >
        Change
      </button>
      <button onClick={onDismiss} className="cursor-pointer text-slate-400 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function ChangeDayModal({
  widget,
  days,
  currentDayId,
  onClose,
  onConfirm,
}: {
  widget: Widget
  days: Day[]
  currentDayId?: string
  onClose: () => void
  onConfirm: (day: Day) => void
}) {
  const [selectedDay, setSelectedDay] = useState<Day | null>(
    days.find((d) => d.id === currentDayId) ?? null,
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Save "{widget.title}" to</h3>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-3">
          {widget.image_url && (
            <img
              src={widget.image_url}
              alt={widget.title}
              className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
            />
          )}

          <div className="flex max-h-48 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {days.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day)}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                  selectedDay?.id === day.id
                    ? "border-amber-400 bg-amber-50 text-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-amber-200"
                }`}
              >
                <span className="font-medium">Day {index + 1}</span>
                {day.date && (
                  <span className="text-xs text-slate-400">
                    {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => selectedDay && onConfirm(selectedDay)}
          disabled={!selectedDay}
          className="mt-4 w-full cursor-pointer rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default function ExploreTripPage() {
  const params = useParams<{ tripId: string }>()
  const router = useRouter()
  const tripId = params.tripId

  const [activeTab, setActiveTab] = useState<ExploreCategory>("All")

  const { days } = useTripDays(tripId)
  const { isBookmarked, addBookmark, removeBookmark, changeBookmarkDay } = useBookmarks(tripId)

  const [toast, setToast] = useState<{ widget: Widget; day: Day } | null>(null)
  const [changeModalWidget, setChangeModalWidget] = useState<Widget | null>(null)

  const [query, setQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState("")

  function isVisible(category: Exclude<ExploreCategory, "All">) {
    return activeTab === "All" || activeTab === category
  }

  const stays = useExploreSearch(tripId, "Stays", submittedQuery, isVisible("Stays"))
  const activities = useExploreSearch(tripId, "Activities", submittedQuery, isVisible("Activities"))
  const dining = useExploreSearch(tripId, "Dining", submittedQuery, isVisible("Dining"))
  const transportation = useExploreSearch(
    tripId,
    "Transportation",
    submittedQuery,
    isVisible("Transportation"),
  )

  function handleSubmitQuery() {
    setSubmittedQuery(query.trim())
  }

  function handleHeartClick(widget: Widget) {
    if (isBookmarked(widget.title, widget.location)) {
      removeBookmark(widget)
      if (toast?.widget.id === widget.id) setToast(null)
      return
    }
    if (days.length === 0) return
    const defaultDay = days[0]
    if (!defaultDay.date) return
    addBookmark(widget, defaultDay.date)
    setToast({ widget, day: defaultDay })
  }

  function handleConfirmDayChange(day: Day) {
    if (!changeModalWidget || !day.date) return
    changeBookmarkDay(changeModalWidget, day.date)
    setToast({ widget: changeModalWidget, day })
    setChangeModalWidget(null)
  }

  const sections: Array<{
    category: Exclude<ExploreCategory, "All">
    title: string
    subtitle: string
    icon: typeof BedDouble
    widgets: Widget[]
    loading: boolean
    error: string | null
    retry: () => void
  }> = [
    {
      category: "Stays",
      title: "Standout stays",
      subtitle: "Recommended for your trip itinerary.",
      icon: BedDouble,
      widgets: stays.widgets,
      loading: stays.loading,
      error: stays.error,
      retry: stays.retry,
    },
    {
      category: "Activities",
      title: "Things to do",
      subtitle: "Experiences selected for your destination.",
      icon: Ticket,
      widgets: activities.widgets,
      loading: activities.loading,
      error: activities.error,
      retry: activities.retry,
    },
    {
      category: "Dining",
      title: "Dining favorites",
      subtitle: "Restaurants and local favorites nearby.",
      icon: Utensils,
      widgets: dining.widgets,
      loading: dining.loading,
      error: dining.error,
      retry: dining.retry,
    },
    {
      category: "Transportation",
      title: "Getting around",
      subtitle: "Convenient transportation options.",
      icon: CarFront,
      widgets: transportation.widgets,
      loading: transportation.loading,
      error: transportation.error,
      retry: transportation.retry,
    },
  ]

  const visibleSections = sections.filter((section) => isVisible(section.category))

  return (
    <main className="min-h-screen bg-[#fffdf9] text-slate-900">
      <section className="relative isolate min-h-[420px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=2000&q=90"
          alt="Travel destination"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-transparent" />

        <div className="mx-auto flex min-h-[420px] max-w-7xl items-center px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-xl text-white">
            <button
              onClick={() => router.push(`/itinerary/${tripId}/hub/`)}
              className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm backdrop-blur transition hover:bg-white/25"
            >
              <ArrowLeft className="h-4 w-4 text-amber-300" />
              Back to Itinerary
            </button>

            <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-6xl">
              More to explore,
              <br />
              made for your trip.
            </h1>

            <p className="mt-4 max-w-md text-base text-white/85 sm:text-lg">
              Inspiring places and effortless planning, personalized to your itinerary.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-8 lg:px-10">
        <TripInfoBar
          tripId={tripId}
          activeCategory={activeTab}
          onCategoryChange={setActiveTab}
          onSearch={handleSubmitQuery}
        />
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-12 sm:px-8 lg:px-10">
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold">Your trip inspiration</h2>
              <p className="mt-1 text-slate-500">A locally inspired itinerary with flexibility built in.</p>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/itinerary/${tripId}/hub/`)}
              className="hidden cursor-pointer items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900 sm:flex"
            >
              View trip
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.1fr_1fr_.8fr]">
            <img
              src="https://images.unsplash.com/photo-1555881400-69a2384ed1af?auto=format&fit=crop&w=1200&q=85"
              alt="Travel inspiration"
              className="h-full min-h-72 w-full object-cover"
            />

            <div className="space-y-5 p-6">
              {[
                { day: "Day 1", title: "Explore the historic center", icon: MapPin },
                { day: "Day 2", title: "Discover a nearby destination", icon: Ticket },
                { day: "Day 3", title: "Relax and enjoy local favorites", icon: CarFront },
              ].map(({ day, title, icon: Icon }) => (
                <div key={day} className="flex gap-4 border-b border-slate-100 pb-5 last:border-0">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100">
                    <Icon className="h-5 w-5 text-amber-700" />
                  </span>

                  <div>
                    <small className="text-slate-400">{day}</small>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-slate-500">Handpicked for your dates and travel pace.</p>
                  </div>
                </div>
              ))}
            </div>

            <aside className="bg-amber-50 p-6">
              <h3 className="font-serif text-2xl font-semibold">Make it yours</h3>
              <p className="mt-2 text-sm text-slate-600">
                Save the experiences you love and add them to your itinerary.
              </p>

              <div className="my-6 space-y-3 text-sm">
                <p className="flex justify-between">
                  <span>Stays</span>
                  <b>Personalized</b>
                </p>
                <p className="flex justify-between">
                  <span>Activities</span>
                  <b>Curated</b>
                </p>
                <p className="flex justify-between border-t border-amber-200 pt-3">
                  <span>Planning</span>
                  <b>Flexible</b>
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/itinerary/${tripId}`)}
                className="w-full cursor-pointer rounded-xl bg-amber-400 py-3 font-bold hover:bg-amber-300"
              >
                Customize your trip
              </button>
            </aside>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <h2 className="font-serif text-3xl font-semibold">Choose your travel mood</h2>
            <p className="mt-1 text-slate-500">Not sure what you're in the mood for? Let us inspire you.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {moods.map((mood) => (
              <button
                key={mood.title}
                type="button"
                className="group relative min-h-56 cursor-pointer overflow-hidden rounded-2xl text-left text-white"
              >
                <img
                  src={mood.image}
                  alt={mood.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute bottom-5 left-5">
                  <b className="block text-xl">{mood.title}</b>
                  <small className="text-white/80">{mood.subtitle}</small>
                </span>
                <ChevronRight className="absolute bottom-5 right-5 h-8 w-8 rounded-full bg-white p-2 text-slate-900" />
              </button>
            ))}
          </div>
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmitQuery()
          }}
          className="mx-auto flex max-w-2xl items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm"
        >
          <Search className="h-5 w-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search within your trip recommendations, then press Enter"
            className="w-full bg-transparent text-sm outline-none"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300"
          >
            Search
          </button>
        </form>

        {visibleSections.map((section) => {
          const Icon = section.icon

          let sectionBody = (
            <div className={CARD_GRID}>
              {section.widgets.map((widget) => (
                <ResultCard
                  key={widget.id}
                  widget={widget}
                  category={section.category}
                  saved={isBookmarked(widget.title, widget.location)}
                  onHeartClick={() => handleHeartClick(widget)}
                  onOpen={() => {
                    saveExploreSelection(tripId, widget)
                    router.push(`/itinerary/${tripId}/explore/${section.category.toLowerCase()}`)
                  }}
                />
              ))}
            </div>
          )

          if (section.error) {
            sectionBody = <ErrorBlock message={section.error} onRetry={section.retry} />
          } else if (section.loading) {
            sectionBody = <SkeletonGrid />
          } else if (section.widgets.length === 0) {
            sectionBody = (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                No results were found for this search.
              </div>
            )
          }

          return (
            <section key={section.category}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 font-serif text-3xl font-semibold">
                    <Icon className="h-6 w-6 text-slate-500" />
                    {section.title}
                  </h2>
                  <p className="mt-1 text-slate-500">{section.subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/itinerary/${tripId}/explore/${section.category.toLowerCase()}`)}
                  className="flex shrink-0 cursor-pointer items-center gap-1 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {sectionBody}
            </section>
          )
        })}

        {visibleSections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 text-xl font-semibold">No recommendations found</h2>
            <p className="mt-1 text-slate-500">Try another search or category.</p>
          </div>
        )}
      </div>

      {toast && (
        <BookmarkToast
          dayLabel={`Day ${days.findIndex((d) => d.id === toast.day.id) + 1}`}
          onChange={() => {
            setChangeModalWidget(toast.widget)
            setToast(null)
          }}
          onDismiss={() => setToast(null)}
        />
      )}

      {changeModalWidget && (
        <ChangeDayModal
          widget={changeModalWidget}
          days={days}
          currentDayId={toast?.widget.id === changeModalWidget.id ? toast.day.id : undefined}
          onClose={() => setChangeModalWidget(null)}
          onConfirm={handleConfirmDayChange}
        />
      )}
    </main>
  )
}