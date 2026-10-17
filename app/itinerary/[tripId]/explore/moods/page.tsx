
"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Compass,
  Heart,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react"

import {
  travelMoods,
  moodCategories,
  type MoodCategory,
  type TravelMood,
} from "../mood/moodConfig"

type CategoryFilter = MoodCategory | "All Moods"

function MoodCard({
  mood,
  onClick,
  large = false,
}: {
  mood: TravelMood
  onClick: () => void
  large?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Explore ${mood.title}`}
      className={[
        "group relative block w-full overflow-hidden",
        "rounded-2xl bg-slate-800 text-left text-white",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        "focus-visible:outline-none",
        "focus-visible:ring-4 focus-visible:ring-amber-400",
        large ? "h-[310px]" : "h-[270px]",
      ].join(" ")}
    >
      <img
        src={mood.image}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />

      {mood.featured && (
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-bold text-slate-950 shadow-sm">
          <Sparkles className="h-3 w-3" />
          Featured
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
        <span className="min-w-0">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-amber-300">
            {mood.category}
          </span>

          <span className="block font-serif text-2xl font-semibold leading-tight">
            {mood.title}
          </span>

          <span className="mt-2 block text-sm leading-5 text-white/80">
            {mood.subtitle}
          </span>
        </span>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 shadow-sm transition-colors group-hover:bg-amber-400">
          <ArrowRight className="h-5 w-5" />
        </span>
      </span>
    </button>
  )
}

export default function AllTravelMoodsPage() {
  const router = useRouter()
  const params = useParams<{ tripId: string }>()
  const tripId = params.tripId

  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("All Moods")

  const [showInfo, setShowInfo] = useState(false)

  const exploreBase = `/itinerary/${encodeURIComponent(
    tripId,
  )}/explore`

  function openMood(mood: TravelMood) {
    router.push(
      `${exploreBase}/mood/${encodeURIComponent(mood.slug)}`,
    )
  }

  const featuredMoods = useMemo(
    () => travelMoods.filter((mood) => mood.featured),
    [],
  )

  const filteredMoods = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()

    return travelMoods.filter((mood) => {
      const matchesCategory =
        activeCategory === "All Moods" ||
        mood.category === activeCategory

      const searchText = [
        mood.title,
        mood.subtitle,
        mood.description,
        mood.category,
        ...mood.keywords,
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch =
        !normalizedSearch ||
        searchText.includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [search, activeCategory])

  function resetFilters() {
    setSearch("")
    setActiveCategory("All Moods")
  }

  return (
    <main className="min-h-screen bg-[#fffdf9] text-slate-900">
      {/* Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => router.push(exploreBase)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Compass className="h-4 w-4 text-amber-600" />
            <span className="hidden sm:inline">
              TravelBee
            </span>
            <ChevronRight className="hidden h-3 w-3 text-slate-400 sm:block" />
            <span className="text-slate-900">
              Travel Moods
            </span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative isolate flex min-h-[400px] items-center overflow-hidden bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=90"
          alt="Travel inspiration"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-900/20" />

        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-2xl text-white">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold tracking-wide backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              DISCOVER YOUR TRAVEL STYLE
            </span>

            <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Every journey has
              <br />
              <span className="text-amber-300">
                its own mood.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              From unforgettable adventures to peaceful
              escapes, find the experiences that match
              the way you want to travel.
            </p>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("all-travel-moods")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Find your mood
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Moods */}
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8 lg:px-10">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              START EXPLORING
            </p>

            <h2 className="font-serif text-3xl font-semibold">
              Popular travel moods
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Three of our favorite ways to experience
              a destination.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Sparkles className="h-4 w-4" />
            Featured collections
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredMoods.map((mood) => (
            <MoodCard
              key={mood.id}
              mood={mood}
              large
              onClick={() => openMood(mood)}
            />
          ))}
        </div>
      </section>

      {/* All Moods */}
      <section
        id="all-travel-moods"
        className="mx-auto max-w-7xl scroll-mt-10 px-5 pb-16 pt-12 sm:px-8 lg:px-10"
      >
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            FIND YOUR INSPIRATION
          </p>

          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            Explore all travel moods
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Browse different travel styles and discover
            recommendations that feel like you.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search moods, interests, or experiences..."
              aria-label="Search travel moods"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="cursor-pointer text-slate-400 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
          >
            <Heart className="h-4 w-4 text-amber-600" />
            How moods work
          </button>
        </div>

        {/* Explanation */}
        {showInfo && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Travel your way
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Choose a travel mood to discover
                  matching restaurants, activities,
                  accommodations, and transportation.
                  Your destination stays connected to
                  your trip, and you can explore as
                  many moods as you like.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInfo(false)}
                aria-label="Close explanation"
                className="cursor-pointer text-slate-400 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-7 flex flex-wrap gap-2">
          {moodCategories.map((category) => {
            const selected =
              activeCategory === category

            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setActiveCategory(category)
                }
                aria-pressed={selected}
                className={[
                  "cursor-pointer rounded-full border px-4 py-2.5",
                  "text-xs font-semibold transition",
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50",
                ].join(" ")}
              >
                {category}
              </button>
            )
          })}
        </div>

        {/* Results Header */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-900">
              {filteredMoods.length}
            </span>{" "}
            {filteredMoods.length === 1
              ? "travel mood"
              : "travel moods"}
          </p>

          {(search || activeCategory !== "All Moods") && (
            <button
              type="button"
              onClick={resetFilters}
              className="cursor-pointer text-sm font-semibold text-amber-700 hover:text-amber-900"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Mood Cards */}
        {filteredMoods.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMoods.map((mood) => (
              <MoodCard
                key={mood.id}
                mood={mood}
                onClick={() => openMood(mood)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Search className="h-10 w-10 text-slate-300" />

            <h3 className="mt-5 text-xl font-semibold">
              No travel moods found
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Try a different search term or choose
              another travel mood category.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 cursor-pointer rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              Show all moods
            </button>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 overflow-hidden rounded-3xl bg-slate-900 p-8 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
              <Check className="h-4 w-4" />
              MADE FOR YOUR TRIP
            </div>

            <h2 className="font-serif text-3xl font-semibold">
              Your journey, your way.
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              Every great trip starts with a little
              inspiration. Discover experiences you
              love and make them part of your itinerary.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(exploreBase)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
          >
            Back to Explore
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  )
}
