"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BedDouble,
  BusFront,
  CalendarPlus,
  Check,
  ExternalLink,
  Heart,
  Info,
  MapPin,
  ShieldCheck,
  Star,
  Ticket,
  Utensils,
} from "lucide-react"
import type { EventLabel, Widget } from "@/app/itinerary/types/types"
import { useTripDays } from "../../components/useTripDays"
import { useBookmarks } from "@/app/itinerary/components/useBookmarks"
import { getExploreSelection } from "../../exploreSelection"

const fallbackImage =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=90"

const categoryLabels: Record<string, string> = {
  stays: "Standout stays",
  activities: "Things to do",
  dining: "Dining favorites",
  transportation: "Getting around",
}

function TypeIcon({ type }: { type: EventLabel }) {
  const className = "h-5 w-5"

  switch (type) {
    case "Activity":
      return <Ticket className={className} />
    case "Transit":
      return <BusFront className={className} />
    case "Reservation":
      return <BedDouble className={className} />
    case "Food":
      return <Utensils className={className} />
  }
}

function formatPrice(price?: number) {
  if (typeof price !== "number") return null

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price)
}

function createMapUrl(location?: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(
    location || "Travel destination",
  )}&z=14&output=embed`
}

export default function ExploreItemDetailsPage() {
  const params = useParams<{
    tripId: string
    category: string
    itemId: string
  }>()
  const router = useRouter()
  const tripId = params.tripId
  const category = params.category.toLowerCase()
  const itemId = decodeURIComponent(params.itemId)
  const resultsHref = `/itinerary/${tripId}/explore/${category}`

  const [widget, setWidget] = useState<Widget | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [selectedDay, setSelectedDay] = useState("")
  const [added, setAdded] = useState(false)

  const { days } = useTripDays(tripId)
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks(tripId)

  useEffect(() => {
    setWidget(getExploreSelection(tripId, itemId))
    setLoaded(true)
  }, [itemId, tripId])

  const saved = useMemo(
    () =>
      widget
        ? isBookmarked(widget.title, widget.location)
        : false,
    [isBookmarked, widget],
  )

  function handleSave() {
    if (!widget) return

    if (saved) {
      removeBookmark(widget)
      return
    }

    const day = selectedDay || days[0]?.date
    if (!day) return

    addBookmark(widget, day)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  if (!loaded) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#fffdf9]">
        <p className="text-sm font-medium text-slate-500">Loading details...</p>
      </main>
    )
  }

  if (!widget) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#fffdf9] px-5">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Info className="mx-auto h-9 w-9 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            This recommendation is no longer available
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Return to the results and select the card again to reopen its details.
          </p>
          <Link
            href={resultsHref}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Link>
        </div>
      </main>
    )
  }

  const price = formatPrice(widget.price)

  return (
    <main className="min-h-screen bg-[#fffdf9] text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <button
          type="button"
          onClick={() => router.push(resultsHref)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {categoryLabels[category] ?? "results"}
        </button>

        <header className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
              <TypeIcon type={widget.type} />
              {categoryLabels[category] ?? "Explore"}
            </div>
            <h1 className="mt-2 max-w-4xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              {widget.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              {typeof widget.rating === "number" && (
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {widget.rating.toFixed(1)}
                </span>
              )}
              {widget.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {widget.location}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            <Heart
              className={`h-4 w-4 ${
                saved ? "fill-amber-400 text-amber-400" : "text-slate-600"
              }`}
            />
            {saved ? "Saved" : "Save"}
          </button>
        </header>

        <section className="mt-7 overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
          <img
            src={widget.image_url || fallbackImage}
            alt={widget.title}
            className="h-[360px] w-full object-cover sm:h-[500px]"
          />
        </section>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-10">
            <section className="border-b border-slate-200 pb-10">
              <h2 className="font-serif text-3xl font-semibold">Overview</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                {widget.description ||
                  `Explore ${widget.title} and decide where it fits in your TravelBee itinerary.`}
              </p>
            </section>

            <section className="border-b border-slate-200 pb-10">
              <h2 className="font-serif text-3xl font-semibold">Highlights</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <ShieldCheck className="h-6 w-6 text-amber-600" />
                  <h3 className="mt-3 font-bold">Trip-ready details</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Keep the key information together while planning your itinerary.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <MapPin className="h-6 w-6 text-amber-600" />
                  <h3 className="mt-3 font-bold">Easy to locate</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Review the location before choosing the best day for your visit.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <CalendarPlus className="h-6 w-6 text-amber-600" />
                  <h3 className="mt-3 font-bold">Built for planning</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Save this recommendation directly to one of your trip days.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-semibold">Explore the area</h2>
              <div className="mt-6 h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                <iframe
                  title={`Map of ${widget.location || widget.title}`}
                  src={createMapUrl(widget.location || widget.title)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
            </section>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg lg:sticky lg:top-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Starting from</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {price || "See provider"}
                </p>
              </div>
              {typeof widget.rating === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {widget.rating.toFixed(1)}
                </span>
              )}
            </div>

            {days.length > 0 && (
              <label className="mt-6 block">
                <span className="text-sm font-bold text-slate-800">Add to a trip day</span>
                <select
                  value={selectedDay}
                  onChange={(event) => setSelectedDay(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                >
                  <option value="">Choose a day</option>
                  {days.map((day, index) => (
                    <option key={day.id} value={day.date || ""} disabled={!day.date}>
                      Day {index + 1}
                      {day.date
                        ? ` - ${new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!saved && (days.length === 0 || !selectedDay)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {added ? <Check className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
              {saved ? "Remove from itinerary" : added ? "Added!" : "Add to itinerary"}
            </button>

            {widget.url && (
              <a
                href={widget.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                View provider details
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              Pricing and availability can change. Confirm final details with the provider.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
