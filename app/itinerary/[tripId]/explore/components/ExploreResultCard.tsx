"use client"

import {
  BedDouble,
  BusFront,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  Star,
  Ticket,
  Utensils,
} from "lucide-react"
import type {
  EventLabel,
  Widget,
} from "@/app/itinerary/types/types"

interface ExploreResultCardProps {
  widget: Widget
  saved?: boolean
  selected?: boolean
  onSave?: (widget: Widget) => void
  onSelect?: (widget: Widget) => void
  onAdd?: (widget: Widget) => void
}

function getTypeLabel(type: EventLabel) {
  switch (type) {
    case "Activity":
      return "Activity"
    case "Transit":
      return "Transportation"
    case "Reservation":
      return "Stay"
    case "Food":
      return "Dining"
  }
}

function getTypeStyles(type: EventLabel) {
  switch (type) {
    case "Activity":
      return "bg-emerald-50 text-emerald-700"
    case "Transit":
      return "bg-violet-50 text-violet-700"
    case "Reservation":
      return "bg-blue-50 text-blue-700"
    case "Food":
      return "bg-orange-50 text-orange-700"
  }
}

function TypeIcon({
  type,
}: {
  type: EventLabel
}) {
  const iconClassName = "h-3 w-3"

  switch (type) {
    case "Activity":
      return (
        <Ticket className={iconClassName} />
      )
    case "Transit":
      return (
        <BusFront className={iconClassName} />
      )
    case "Reservation":
      return (
        <BedDouble className={iconClassName} />
      )
    case "Food":
      return (
        <Utensils className={iconClassName} />
      )
  }
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
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=85"

export default function ExploreResultCard({
  widget,
  saved = false,
  selected = false,
  onSave,
  onSelect,
  onAdd,
}: ExploreResultCardProps) {
  const formattedPrice = formatPrice(
    widget.price,
  )

  return (
    <article
      className={[
        "group overflow-hidden rounded-xl border bg-white",
        "transition duration-200",
        selected
          ? "border-amber-400 shadow-md ring-1 ring-amber-200"
          : "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() =>
          onSelect?.(widget)
        }
        className="block w-full text-left"
        aria-label={`Show ${widget.title} on the map`}
      >
        <div className="relative aspect-[16/8] overflow-hidden bg-slate-100">
          <img
            src={
              widget.image_url ||
              fallbackImage
            }
            alt={widget.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <span
            className={[
              "absolute bottom-2 left-2",
              "inline-flex items-center gap-1",
              "rounded-full px-2 py-0.5",
              "text-[11px] font-semibold shadow-sm",
              getTypeStyles(widget.type),
            ].join(" ")}
          >
            <TypeIcon type={widget.type} />
            {getTypeLabel(widget.type)}
          </span>
        </div>
      </button>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              onSelect?.(widget)
            }
            className="min-w-0 flex-1 text-left"
          >
            <h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-amber-700">
              {widget.title}
            </h3>

            {widget.description && (
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                {widget.description}
              </p>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              onSave?.(widget)
            }
            aria-label={
              saved
                ? `Remove ${widget.title} from saved items`
                : `Save ${widget.title}`
            }
            aria-pressed={saved}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white transition hover:border-amber-300 hover:bg-amber-50"
          >
            <Heart
              className={[
                "h-4 w-4",
                saved
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-500",
              ].join(" ")}
            />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
          {widget.location && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />

              <span className="truncate">
                {widget.location}
              </span>
            </span>
          )}

          {widget.day && (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {widget.day}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          {typeof widget.rating ===
          "number" ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {widget.rating.toFixed(1)}
            </span>
          ) : (
            <span />
          )}

          {formattedPrice && (
            <p className="text-sm font-bold text-slate-900">
              {formattedPrice}

              <span className="ml-1 text-[10px] font-normal text-slate-400">
                from
              </span>
            </p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          {widget.url && (
            <a
              href={widget.url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Details
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={() =>
              onAdd?.(widget)
            }
            className="flex-1 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  )
}