"use client"

import {
  ExternalLink,
  LocateFixed,
  MapPin,
  Star,
} from "lucide-react"
import type { Widget } from "@/app/itinerary/types/types"

interface ExploreMapPanelProps {
  location: string
  widgets: Widget[]
  selectedWidget: Widget | null
  onSelectWidget: (widget: Widget) => void
  onSearchArea?: () => void
}

function createMapUrl(location: string) {
  const searchLocation =
    location.trim() || "Lisbon, Portugal"

  return `https://www.google.com/maps?q=${encodeURIComponent(
    searchLocation,
  )}&z=13&output=embed`
}

function formatPrice(price?: number) {
  if (typeof price !== "number") {
    return null
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price)
}

const fallbackImage =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=85"

export default function ExploreMapPanel({
  location,
  widgets,
  selectedWidget,
  onSelectWidget,
  onSearchArea,
}: ExploreMapPanelProps) {
  const mapLocation =
    selectedWidget?.location ||
    location ||
    "Lisbon, Portugal"

  return (
    <aside className="relative h-[720px] min-h-[720px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm lg:sticky lg:top-5 xl:h-[calc(100vh-140px)] xl:min-h-[760px] xl:max-h-[960px]">
      <iframe
        key={mapLocation}
        title={`Map of ${mapLocation}`}
        src={createMapUrl(mapLocation)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10" />

      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <button
          type="button"
          onClick={onSearchArea}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg transition hover:bg-slate-50"
        >
          <LocateFixed className="h-4 w-4" />
          Search this area
        </button>
      </div>

      {widgets.length > 0 && (
        <div className="absolute left-3 top-16 z-10 hidden max-h-[440px] w-52 space-y-1.5 overflow-y-auto rounded-2xl border border-white/80 bg-white/95 p-2 shadow-xl backdrop-blur md:block">
          {widgets
            .slice(0, 10)
            .map((widget, index) => {
              const isSelected =
                selectedWidget?.id ===
                widget.id

              return (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() =>
                    onSelectWidget(widget)
                  }
                  className={[
                    "flex w-full items-center gap-2 rounded-xl p-2 text-left transition",
                    isSelected
                      ? "bg-amber-100"
                      : "hover:bg-slate-100",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                      isSelected
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-800 text-white",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-900">
                      {widget.title}
                    </span>

                    {typeof widget.price ===
                      "number" && (
                      <span className="block text-[11px] text-slate-500">
                        {formatPrice(
                          widget.price,
                        )}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
        </div>
      )}

      {selectedWidget && (
        <div className="absolute bottom-4 left-4 right-4 z-10 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl sm:left-auto sm:w-[380px]">
          <div className="flex">
            <img
              src={
                selectedWidget.image_url ||
                fallbackImage
              }
              alt={selectedWidget.title}
              className="h-32 w-32 shrink-0 object-cover"
            />

            <div className="min-w-0 flex-1 p-4">
              <p className="line-clamp-1 font-bold text-slate-900">
                {selectedWidget.title}
              </p>

              {selectedWidget.location && (
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {selectedWidget.location}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <span>
                  {typeof selectedWidget.rating ===
                  "number" && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {selectedWidget.rating.toFixed(
                        1,
                      )}
                    </span>
                  )}
                </span>

                {typeof selectedWidget.price ===
                  "number" && (
                  <span className="font-bold text-slate-900">
                    {formatPrice(
                      selectedWidget.price,
                    )}
                  </span>
                )}
              </div>

              {selectedWidget.url && (
                <a
                  href={selectedWidget.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  View details
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {!selectedWidget && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-2xl bg-white/95 p-4 text-center shadow-xl backdrop-blur">
          <MapPin className="mx-auto h-5 w-5 text-amber-500" />

          <p className="mt-1 text-sm font-semibold text-slate-800">
            Select a result to view it on the
            map
          </p>
        </div>
      )}
    </aside>
  )
}