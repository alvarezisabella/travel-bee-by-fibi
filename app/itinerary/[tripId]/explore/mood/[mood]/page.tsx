
"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CarFront,
  Check,
  ChevronDown,
  Heart,
  Loader2,
  Search,
  Sparkles,
  LayoutGrid,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  Ticket,
  Utensils,
  X,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import ExploreMapPanel from "../../components/ExploreMapPanel"
import ExploreResultCard from "../../components/ExploreResultCard"
import type { Widget } from "@/app/itinerary/types/types"
import { useExploreSearch } from "../../useExploreSearch"
import { useTripDays } from "../../components/useTripDays"
import { useBookmarks } from "@/app/itinerary/components/useBookmarks"
import { saveExploreSelection } from "../../exploreSelection"
import {
  getTravelMood,
  travelMoods,
  type MoodExploreCategory,
} from "../moodConfig"

type MoodTab = MoodExploreCategory | "All"
type MoodSort = "recommended" | "rating" | "price-low" | "price-high"

const categories: MoodTab[] = [
  "All",
  "Activities",
  "Dining",
  "Stays",
  "Transportation",
]

const categoryIcons = {
  All: LayoutGrid,
  Activities: Ticket,
  Dining: Utensils,
  Stays: BedDouble,
  Transportation: CarFront,
}

export default function MoodDiscoveryPage() {
  const router = useRouter()
  const params = useParams<{ tripId: string; mood: string }>()

  const tripId = params.tripId
  const moodSlug = params.mood

  const mood = getTravelMood(moodSlug)

  const base = `/itinerary/${encodeURIComponent(tripId)}/explore`

  const [category, setCategory] =
    useState<MoodTab>("Activities")
  const [view, setView] = useState<"list" | "map">("list")
  const [sort, setSort] = useState<MoodSort>("recommended")
  const [minRating, setMinRating] = useState(0)
  const [mapSelection, setMapSelection] = useState<Widget | null>(null)
  const [tripLocation, setTripLocation] = useState("")

  const [searchInput, setSearchInput] = useState("")
  const [submittedSearch, setSubmittedSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(12)

  const [selectedWidget, setSelectedWidget] =
    useState<Widget | null>(null)

  const [selectedDay, setSelectedDay] = useState("")
  const [notification, setNotification] = useState("")

  const { days } = useTripDays(tripId)

  const {
    isBookmarked,
    addBookmark,
    removeBookmark,
  } = useBookmarks(tripId)

  // Hooks are unconditional. Only the visible category (or all four for
  // the All tab) makes a request; other category searches are disabled.
  const activities = useExploreSearch(tripId, "Activities", submittedSearch,
    Boolean(mood) && (category === "All" || category === "Activities"),
    { mood: mood?.slug, combined: true })
  const dining = useExploreSearch(tripId, "Dining", submittedSearch,
    Boolean(mood) && (category === "All" || category === "Dining"),
    { mood: mood?.slug, combined: true })
  const stays = useExploreSearch(tripId, "Stays", submittedSearch,
    Boolean(mood) && (category === "All" || category === "Stays"),
    { mood: mood?.slug, combined: true })
  const transportation = useExploreSearch(tripId, "Transportation", submittedSearch,
    Boolean(mood) && (category === "All" || category === "Transportation"),
    { mood: mood?.slug, combined: true })

  const searches = { Activities: activities, Dining: dining,
    Stays: stays, Transportation: transportation }
  const activeSearches = category === "All"
    ? [activities, dining, stays, transportation]
    : [searches[category]]
  const loading = activeSearches.some((search) => search.loading)
  const error = activeSearches.every((search) => search.error)
    ? activeSearches.map((search) => search.error).filter(Boolean).join("; ")
    : null
  const retry = () => activeSearches.forEach((search) => search.retry())
  const widgets = useMemo(() => {
    if (category !== "All") return searches[category].widgets
    const lists = [activities.widgets, dining.widgets, stays.widgets,
      transportation.widgets]
    const seen = new Set<string>()
    const merged: Widget[] = []
    for (let index = 0; index < Math.max(...lists.map((list) => list.length), 0); index++) {
      for (const list of lists) {
        const widget = list[index]
        if (!widget) continue
        const key = `${widget.type}:${widget.id}`
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(widget)
      }
    }
    return merged
  }, [category, activities.widgets, dining.widgets, stays.widgets, transportation.widgets])

  const filteredWidgets = useMemo(() => {
    const result = widgets.filter((widget) =>
      typeof widget.rating !== "number" ? minRating === 0 : widget.rating >= minRating)
    if (sort === "rating") result.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
    if (sort === "price-low") result.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    if (sort === "price-high") result.sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
    return result
  }, [widgets, minRating, sort])
  const displayedWidgets = filteredWidgets.slice(0, visibleCount)
  // Organize existing recommendations without making additional API calls.
  // The API already returns mood-ranked results in its recommended order.
  const discoveryCollections = useMemo(() => {
    const topPicks = filteredWidgets.slice(0, 3)
    const topIds = new Set(topPicks.map((widget) => `${widget.type}:${widget.id}`))

    const highlyRated = filteredWidgets
      .filter((widget) =>
        typeof widget.rating === "number" && widget.rating >= 4.5,
      )
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 3)

    const usedIds = new Set([
      ...topIds,
      ...highlyRated.map((widget) => `${widget.type}:${widget.id}`),
    ])

    // Favor later recommendations and, on All, different result categories.
    const differentCandidates = filteredWidgets
      .slice(3)
      .filter((widget) => !usedIds.has(`${widget.type}:${widget.id}`))
    const different: Widget[] = []
    const seenTypes = new Set<string>()
    for (const widget of differentCandidates) {
      if (different.length >= 3) break
      if (!seenTypes.has(widget.type)) {
        different.push(widget)
        seenTypes.add(widget.type)
      }
    }
    for (const widget of differentCandidates) {
      if (different.length >= 3) break
      if (!different.some((selected) => selected.id === widget.id && selected.type === widget.type)) {
        different.push(widget)
      }
    }

    return [
      {
        id: "top-picks",
        title: "Top Picks for Your Mood",
        description: "The first matches from your mood-ranked recommendations.",
        items: topPicks,
      },
      {
        id: "highly-rated",
        title: "Highly Rated Experiences",
        description: "Experiences rated 4.5 stars or higher by their provider.",
        items: highlyRated,
      },
      {
        id: "something-different",
        title: "Discover Something Different",
        description: "More ideas from your mood collection, beyond the top picks.",
        items: different,
      },
    ].filter((collection) => collection.items.length > 0)
  }, [filteredWidgets])
  const keywords = category === "All" ? [] : (mood?.searchQueries[category] ?? [])
  const visibleKeywords = submittedSearch ? [submittedSearch] : keywords.slice(0, 4)

  useEffect(() => {
    if (!tripId) return
    let cancelled = false
    const supabase = createClient()
    supabase.from("itineraries").select("location").eq("id", tripId).single()
      .then(({ data }) => { if (!cancelled) setTripLocation(data?.location ?? "") })
    return () => { cancelled = true }
  }, [tripId])

  const relatedMoods = useMemo(() => {
    if (!mood) return []

    return travelMoods
      .filter((item) => item.slug !== mood.slug)
      .sort((a, b) => {
        const aMatch = a.category === mood.category ? 1 : 0
        const bMatch = b.category === mood.category ? 1 : 0
        return bMatch - aMatch
      })
      .slice(0, 3)
  }, [mood])

  useEffect(() => {
    setSelectedDay(days.find((day) => day.date)?.date ?? "")
  }, [days])

  function changeCategory(next: MoodTab) {
    setCategory(next)
    setSearchInput("")
    setSubmittedSearch("")
    setVisibleCount(12)
    setMapSelection(null)
    setSort("recommended")
  }

  function searchFor(query: string) {
    setSearchInput(query)
    setSubmittedSearch(query.trim())
    setVisibleCount(12)
  }

  function exploreAnotherSuggestion() {
    // Return to the complete curated collection after a specific search.
    if (submittedSearch) {
      searchFor("")
      return
    }
    // The complete collection is already loaded; reveal the next batch.
    if (visibleCount < filteredWidgets.length) {
      setVisibleCount((current) => current + 12)
      return
    }
    retry()
  }

  function openDetails(widget: Widget) {
    saveExploreSelection(tripId, widget)

    const cardCategory = widget.type === "Food" ? "dining" :
      widget.type === "Reservation" ? "stays" :
      widget.type === "Transit" ? "transportation" : "activities"
    router.push(`${base}/${cardCategory}/${encodeURIComponent(widget.id)}`)
  }

  function openBookmarkModal(widget: Widget) {
    if (isBookmarked(widget.title, widget.location)) {
      removeBookmark(widget)
      setNotification(`Removed ${widget.title} from saved ideas.`)
      return
    }

    setSelectedWidget(widget)
  }

  function confirmBookmark() {
    if (!selectedWidget || !selectedDay) return

    addBookmark(selectedWidget, selectedDay)

    const chosenDay = days.findIndex(
      (day) => day.date === selectedDay,
    )

    setNotification(
      `Saved ${selectedWidget.title} to Day ${chosenDay + 1}.`,
    )

    setSelectedWidget(null)
  }

  if (!mood) {
    return (
      <main className="flex min-h-[75vh] flex-col items-center justify-center bg-[#fffdf9] px-5 text-center">
        <Sparkles className="h-10 w-10 text-amber-500" />

        <h1 className="mt-4 font-serif text-3xl font-semibold">
          Travel mood not found
        </h1>

        <p className="mt-3 text-slate-500">
          This travel mood isn't available yet.
        </p>

        <button
          onClick={() => router.push(`${base}/moods`)}
          className="mt-6 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950"
        >
          Explore all moods
        </button>
      </main>
    )
  }

  const CategoryIcon = categoryIcons[category]

  return (
    <main className="min-h-screen bg-[#fffdf9] text-slate-900">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button
            onClick={() => router.push(`${base}/moods`)}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            All travel moods
          </button>

          <button
            onClick={() => router.push(base)}
            className="text-sm font-semibold text-amber-700 hover:text-amber-900"
          >
            Back to Explore
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate min-h-[390px] overflow-hidden bg-slate-900">
        <img
          src={mood.heroImage}
          alt={mood.title}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />

        <div className="mx-auto flex min-h-[390px] max-w-7xl items-center px-5 py-16 sm:px-8">
          <div className="max-w-2xl text-white">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              YOUR TRAVEL MOOD
            </span>

            <h1 className="font-serif text-5xl font-semibold leading-tight sm:text-6xl">
              {mood.title}
            </h1>

            <h2 className="mt-3 text-xl font-medium text-amber-300">
              {mood.subtitle}
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-white/85">
              {mood.description}
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("mood-results")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 hover:bg-amber-300"
            >
              Explore experiences
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-12 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              MADE FOR YOUR JOURNEY
            </p>

            <h2 className="mt-2 font-serif text-3xl font-semibold">
              Discover your kind of adventure
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Explore places and experiences that match
              your mood. Switch categories, try different
              suggestions, or search for something specific.
            </p>
          </div>

          <button
            onClick={() => router.push(`${base}/moods`)}
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900"
          >
            Change travel mood
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Search / Results */}
      <section
        id="mood-results"
        className="mx-auto max-w-7xl scroll-mt-8 px-5 pb-16 sm:px-8"
      >
        {/* Categories */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((item) => {
            const Icon = categoryIcons[item]
            const active = category === item

            return (
              <button
                key={item}
                type="button"
                onClick={() => changeCategory(item)}
                className={[
                  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-bold transition",
                  active
                    ? "border-amber-400 bg-amber-400 text-slate-950 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                {item}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            searchFor(searchInput)
          }}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder={`Search ${category === "All" ? "all categories" : category.toLowerCase()} for ${mood.title.toLowerCase()}...`}
              className="w-full bg-transparent text-sm outline-none"
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => searchFor("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300"
          >
            Search
          </button>
        </form>

        {/* Quick Suggestions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-slate-500">
            Try:
          </span>

          {keywords.map((keyword) => (
            <button
              key={keyword}
              onClick={() => searchFor(keyword)}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-amber-400 hover:bg-amber-50"
            >
              {keyword}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className="mb-6 mt-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
              <CategoryIcon className="h-4 w-4" />
              {mood.title} / {category}
            </p>

            <h2 className="font-serif text-3xl font-semibold">
              Recommended {category === "All" ? "experiences" : category.toLowerCase()}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {submittedSearch
                ? `Searching for "${submittedSearch}"`
                : category === "All" ? "Browse mood recommendations across all four categories" : `Combined recommendations from ${visibleKeywords.length} mood searches for your destination` }
            </p>
          </div>

          <button
            onClick={exploreAnotherSuggestion}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-amber-300 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-amber-600" />
            {submittedSearch ? "All mood recommendations" : visibleCount < filteredWidgets.length ? "Load more" : "Refresh inspiration"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
            <p className="text-sm text-red-600">{error}</p>

            <button
              onClick={retry}
              className="mt-4 cursor-pointer rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {!error && loading && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />

            <p className="text-sm text-slate-500">
              Finding experiences for your travel mood...
            </p>
          </div>
        )}

        {/* View and filtering controls */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "list" ? "bg-amber-400" : "bg-slate-100"}`}>
              <List className="h-4 w-4" /> List
            </button>
            <button type="button" onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === "map" ? "bg-amber-400" : "bg-slate-100"}`}>
              <MapIcon className="h-4 w-4" /> List + Map
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <select aria-label="Minimum rating" value={minRating}
              onChange={(event) => { setMinRating(Number(event.target.value)); setVisibleCount(12) }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value={0}>Any rating</option><option value={4}>4.0+ stars</option>
              <option value={4.5}>4.5+ stars</option>
            </select>
            <select aria-label="Sort recommendations" value={sort}
              onChange={(event) => { setSort(event.target.value as MoodSort); setVisibleCount(12) }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="recommended">Recommended</option>
              <option value="rating">Highest rated</option>
              {category !== "All" && category !== "Dining" && <>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </>}
            </select>
          </div>
        </div>
        {!error && !loading && (
          <p className="mb-5 text-sm text-slate-500">
            Showing {displayedWidgets.length} of {filteredWidgets.length} recommendations
          </p>
        )}
        {/* Curated collections reuse the results already fetched for this mood. */}
        {!error && !loading && !submittedSearch && discoveryCollections.length > 0 && (
          <div className="mb-10 space-y-9">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                CURATED FOR YOUR MOOD
              </p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-slate-900">
                Start with these discoveries
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Collections drawn from your current recommendations. Browse the full results below.
              </p>
            </div>
            {discoveryCollections.map((collection) => (
              <section key={collection.id} aria-label={collection.title}>
                <div className="mb-4">
                  <h4 className="font-serif text-xl font-semibold text-slate-900">
                    {collection.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {collection.description}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {collection.items.map((widget) => (
                    <ExploreResultCard
                      key={`${collection.id}-${widget.type}-${widget.id}`}
                      widget={widget}
                      saved={isBookmarked(widget.title, widget.location)}
                      selected={mapSelection?.id === widget.id}
                      onSelect={setMapSelection}
                      onHeartClick={openBookmarkModal}
                      onAdd={openBookmarkModal}
                      onViewDetails={openDetails}
                    />
                  ))}
                </div>
              </section>
            ))}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-serif text-2xl font-semibold text-slate-900">
                All recommendations
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Explore every matching result, including the picks above.
              </p>
            </div>
          </div>
        )}

        {!error && !loading && displayedWidgets.length > 0 && (
          <div className={view === "map" ? "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" : ""}>
            <div className={view === "map" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
              {displayedWidgets.map((widget) => (
                <ExploreResultCard key={`${widget.type}-${widget.id}`} widget={widget}
                  saved={isBookmarked(widget.title, widget.location)}
                  selected={mapSelection?.id === widget.id}
                  onSelect={setMapSelection}
                  onHeartClick={openBookmarkModal}
                  onAdd={openBookmarkModal}
                  onViewDetails={openDetails} />
              ))}
            </div>
            {view === "map" && (
              <ExploreMapPanel location={tripLocation} widgets={displayedWidgets}
                selectedWidget={mapSelection}
                onSelectWidget={setMapSelection} onSearchArea={retry} />
            )}
          </div>
        )}
        {!error && !loading && visibleCount < filteredWidgets.length && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setVisibleCount((value) => value + 12)}
              className="rounded-xl bg-amber-400 px-8 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300">
              Load More ({filteredWidgets.length - displayedWidgets.length} remaining)
            </button>
          </div>
        )}

        {/* Empty */}
        {!error && !loading && filteredWidgets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Search className="mx-auto h-10 w-10 text-slate-300" />

            <h3 className="mt-4 text-xl font-semibold">
              No recommendations found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try another keyword or explore a different category.
            </p>

            <button
              onClick={exploreAnotherSuggestion}
              className="mt-5 cursor-pointer rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold"
            >
              Try another suggestion
            </button>
          </div>
        )}
      </section>

      {/* Related Moods */}
      <section className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
              KEEP EXPLORING
            </p>

            <h2 className="mt-2 font-serif text-3xl font-semibold">
              You might also love
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {relatedMoods.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  router.push(`${base}/mood/${item.slug}`)
                }
                className="group relative h-52 cursor-pointer overflow-hidden rounded-2xl bg-slate-900 text-left text-white"
              >
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <span className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/10" />

                <span className="absolute bottom-5 left-5">
                  <span className="block font-serif text-xl font-semibold">
                    {item.title}
                  </span>

                  <span className="mt-1 block text-xs text-white/80">
                    {item.subtitle}
                  </span>
                </span>

                <ArrowRight className="absolute bottom-5 right-5 h-8 w-8 rounded-full bg-white p-2 text-slate-950" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bookmark Modal */}
      {selectedWidget && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedWidget(null)
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Save experience to itinerary"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">
                  Save to your itinerary
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedWidget.title}
                </p>
              </div>

              <button
                onClick={() => setSelectedWidget(null)}
                aria-label="Close"
                className="cursor-pointer text-slate-400 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {days.length > 0 ? (
              <>
                <label className="mt-6 block text-sm font-semibold">
                  Choose a trip day
                </label>

                <div className="relative mt-2">
                  <select
                    value={selectedDay}
                    onChange={(event) =>
                      setSelectedDay(event.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-amber-400"
                  >
                    <option value="">
                      Select a day
                    </option>

                    {days.map((day, index) => (
                      <option
                        key={day.id}
                        value={day.date ?? ""}
                        disabled={!day.date}
                      >
                        Day {index + 1}
                        {day.date ? ` - ${day.date}` : ""}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>

                <button
                  onClick={confirmBookmark}
                  disabled={!selectedDay}
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Heart className="h-4 w-4" />
                  Save experience
                </button>
              </>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-slate-500">
                  Add dates to your trip before saving
                  experiences to a specific day.
                </p>

                <button
                  onClick={() =>
                    router.push(`/itinerary/${tripId}/hub`)
                  }
                  className="mt-5 w-full rounded-xl bg-amber-400 py-3 text-sm font-bold"
                >
                  Go to Trip Hub
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-xl"
        >
          <Check className="h-5 w-5 shrink-0 text-amber-400" />

          <span>{notification}</span>

          <button
            onClick={() => setNotification("")}
            aria-label="Dismiss"
            className="ml-2 cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  )
}
