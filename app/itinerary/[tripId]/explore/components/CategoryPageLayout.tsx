"use client"

import {
  AlertCircle,
  Loader2,
  RotateCcw,
  SearchX,
  SlidersHorizontal,
} from "lucide-react"
import { useMemo, useState } from "react"
import type { Widget } from "@/app/itinerary/types/types"
import ExploreMapPanel from "./ExploreMapPanel"
import ExploreResultCard from "./ExploreResultCard"

type SortOption =
  | "recommended"
  | "rating"
  | "price-low"
  | "price-high"

interface CategoryPageLayoutProps {
  title: string
  subtitle?: string
  location: string
  widgets: Widget[]
  loading: boolean
  error: string | null
  selectedWidgetId: string | null
  savedWidgetIds: string[]
  onSelectWidget: (widget: Widget) => void
  onToggleSaved: (widget: Widget) => void
  onAddWidget: (widget: Widget) => void
  onRetry: () => void
  onSearchArea?: () => void
}

export default function CategoryPageLayout({
  title,
  subtitle,
  location,
  widgets,
  loading,
  error,
  selectedWidgetId,
  savedWidgetIds,
  onSelectWidget,
  onToggleSaved,
  onAddWidget,
  onRetry,
  onSearchArea,
}: CategoryPageLayoutProps) {
  const [sort, setSort] =
    useState<SortOption>("recommended")

  const sortedWidgets = useMemo(() => {
    const copiedWidgets = [...widgets]

    switch (sort) {
      case "rating":
        return copiedWidgets.sort(
          (a, b) =>
            (b.rating ?? 0) -
            (a.rating ?? 0),
        )

      case "price-low":
        return copiedWidgets.sort(
          (a, b) =>
            (a.price ??
              Number.MAX_SAFE_INTEGER) -
            (b.price ??
              Number.MAX_SAFE_INTEGER),
        )

      case "price-high":
        return copiedWidgets.sort(
          (a, b) =>
            (b.price ?? 0) -
            (a.price ?? 0),
        )

      default:
        return copiedWidgets
    }
  }, [sort, widgets])

  const selectedWidget =
    sortedWidgets.find(
      (widget) =>
        widget.id === selectedWidgetId,
    ) ?? null

  if (loading) {
    return (
      <section className="grid min-h-[620px] place-items-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Finding recommendations for your
            trip...
          </p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="grid min-h-[520px] place-items-center rounded-2xl border border-red-200 bg-white p-8">
        <div className="max-w-md text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </span>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Recommendations could not be loaded
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:grid-cols-[minmax(560px,0.78fr)_minmax(0,1.22fr)]">
      <div className="min-w-0">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            )}

            <p className="mt-2 text-sm font-medium text-slate-600">
              {sortedWidgets.length}{" "}
              {sortedWidgets.length === 1
                ? "result"
                : "results"}
              {location
                ? ` in ${location}`
                : ""}
            </p>
          </div>

          <label className="flex shrink-0 items-center gap-2 text-sm text-slate-600">
            <SlidersHorizontal className="h-4 w-4" />

            <span className="sr-only">
              Sort results
            </span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target
                    .value as SortOption,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            >
              <option value="recommended">
                Recommended
              </option>

              <option value="rating">
                Highest rated
              </option>

              <option value="price-low">
                Price: low to high
              </option>

              <option value="price-high">
                Price: high to low
              </option>
            </select>
          </label>
        </header>

        {sortedWidgets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {sortedWidgets.map(
              (widget) => (
                <ExploreResultCard
                  key={widget.id}
                  widget={widget}
                  selected={
                    selectedWidgetId ===
                    widget.id
                  }
                  saved={savedWidgetIds.includes(
                    widget.id,
                  )}
                  onSelect={onSelectWidget}
                  onSave={onToggleSaved}
                  onAdd={onAddWidget}
                />
              ),
            )}
          </div>
        ) : (
          <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8">
            <div className="max-w-sm text-center">
              <SearchX className="mx-auto h-9 w-9 text-slate-400" />

              <h3 className="mt-3 text-lg font-bold text-slate-900">
                No recommendations found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try another search phrase or
                choose a different category.
              </p>
            </div>
          </div>
        )}
      </div>

      <ExploreMapPanel
        location={location}
        widgets={sortedWidgets}
        selectedWidget={selectedWidget}
        onSelectWidget={onSelectWidget}
        onSearchArea={onSearchArea}
      />
    </section>
  )
}