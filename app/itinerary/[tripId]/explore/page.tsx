"use client"

import { useMemo, useState } from "react"
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
} from "lucide-react"
import { useParams } from "next/navigation"
import TripInfoBar, {
  ExploreCategory,
} from "./components/TripInfoBar"
import { Widget } from "@/app/itinerary/types/types"
import { useExploreSearch } from "./useExploreSearch"

type ExploreItem = {
  id: number | string
  title: string
  location: string
  price: string
  rating: string
  image: string
  category:
    | "Stays"
    | "Activities"
    | "Dining"
    | "Transportation"
  meta: string
  // Defaults to "/ person" when omitted. Live dining results pass "" because
  // their price is a tier, not a per-head figure.
  priceNote?: string
}

const CARD_GRID =
  "grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"

// Placeholder count matches RESULT_LIMIT in the search route so the layout
// doesn't jump when real results land
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
        className="mt-4 rounded-xl bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
      >
        Try again
      </button>
    </div>
  )
}

// The two sources mean different things by Widget.price. Dining sends a 0 to 4
// Places tier, Stays sends a nightly dollar amount from SerpAPI.
function widgetToExploreItem(
  widget: Widget,
  category: ExploreItem["category"],
): ExploreItem {
  let price = ""
  let priceNote = ""

  if (category === "Stays") {
    if (widget.price) {
      price = `$${widget.price.toLocaleString()}`
      priceNote = "/ night"
    }
  } else if (widget.price === 0) {
    price = "Free"
  } else if (widget.price) {
    price = "$".repeat(widget.price)
  }

  return {
    id: widget.id,
    title: widget.title,
    location: widget.location ?? "",
    price,
    priceNote,
    rating: widget.rating ? widget.rating.toFixed(1) : "",
    image: widget.image_url ?? "",
    category,
    meta: widget.description ?? "",
  }
}

const items: ExploreItem[] = [
  // Stays
  {
    id: 1,
    title: "Dear Lisbon – Bairro Alto",
    location: "Bairro Alto",
    price: "$245",
    rating: "4.8",
    category: "Stays",
    meta: "Boutique hotel",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 2,
    title: "Memmo Alfama Hotel",
    location: "Alfama",
    price: "$215",
    rating: "4.7",
    category: "Stays",
    meta: "Rooftop views",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 3,
    title: "The Lumiares Hotel & Spa",
    location: "Bairro Alto",
    price: "$320",
    rating: "4.9",
    category: "Stays",
    meta: "Luxury hotel",
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 4,
    title: "Santiago de Alfama",
    location: "Alfama",
    price: "$175",
    rating: "4.6",
    category: "Stays",
    meta: "Boutique hotel",
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 5,
    title: "Palácio Ramalhete",
    location: "Santos",
    price: "$290",
    rating: "4.8",
    category: "Stays",
    meta: "Historic mansion",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 6,
    title: "Convento do Salvador",
    location: "Alfama",
    price: "$260",
    rating: "4.7",
    category: "Stays",
    meta: "Design hotel",
    image:
      "https://images.unsplash.com/photo-1521783988139-89397d761dce?auto=format&fit=crop&w=900&q=85",
  },
  // Activities
  {
    id: 7,
    title: "Sintra & Cascais Tour",
    location: "Sintra",
    price: "$89",
    rating: "4.9",
    category: "Activities",
    meta: "8 hours",
    image:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 8,
    title: "Belém Food Walk",
    location: "Belém",
    price: "$49",
    rating: "4.8",
    category: "Activities",
    meta: "3 hours",
    image:
      "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 9,
    title: "Fado Show & Dinner",
    location: "Alfama",
    price: "$75",
    rating: "4.7",
    category: "Activities",
    meta: "Evening",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 10,
    title: "Tagus River Cruise",
    location: "Cais do Sodré",
    price: "$38",
    rating: "4.6",
    category: "Activities",
    meta: "Sunset · 2 hours",
    image:
      "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 11,
    title: "LX Factory Street Art Tour",
    location: "Alcântara",
    price: "$29",
    rating: "4.5",
    category: "Activities",
    meta: "2.5 hours",
    image:
      "https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 12,
    title: "Oceanário de Lisboa Visit",
    location: "Parque das Nações",
    price: "$24",
    rating: "4.8",
    category: "Activities",
    meta: "Half day",
    image:
      "https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?auto=format&fit=crop&w=900&q=85",
  },
  // Dining
  {
    id: 13,
    title: "Time Out Market Lisboa",
    location: "Cais do Sodré",
    price: "$35",
    rating: "4.6",
    category: "Dining",
    meta: "Food hall",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 14,
    title: "Rooftop at Bairro",
    location: "Bairro Alto",
    price: "$95",
    rating: "4.5",
    category: "Dining",
    meta: "Mediterranean",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 15,
    title: "A Cevicheria",
    location: "Príncipe Real",
    price: "$110",
    rating: "4.7",
    category: "Dining",
    meta: "Seafood",
    image:
      "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 16,
    title: "Cantinho do Avillez",
    location: "Chiado",
    price: "$105",
    rating: "4.6",
    category: "Dining",
    meta: "Portuguese",
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 17,
    title: "Pastéis de Belém",
    location: "Belém",
    price: "$8",
    rating: "4.9",
    category: "Dining",
    meta: "Bakery",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 18,
    title: "Taberna da Rua das Flores",
    location: "Chiado",
    price: "$68",
    rating: "4.7",
    category: "Dining",
    meta: "Tapas",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85",
  },
  // Transportation
  {
    id: 19,
    title: "Lisbon Card 72h",
    location: "Citywide",
    price: "$46",
    rating: "4.8",
    category: "Transportation",
    meta: "Transit + attractions",
    image:
      "https://images.unsplash.com/photo-1525207934214-58e69a8f8a93?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 20,
    title: "Airport Transfer",
    location: "LIS Airport",
    price: "$55",
    rating: "4.6",
    category: "Transportation",
    meta: "Private transfer",
    image:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 21,
    title: "24h Public Transport Pass",
    location: "Citywide",
    price: "$12",
    rating: "4.4",
    category: "Transportation",
    meta: "Metro, bus & tram",
    image:
      "https://images.unsplash.com/photo-1555881400-69a2384ed1af?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 22,
    title: "Hop-on Hop-off Bus",
    location: "Citywide",
    price: "$32",
    rating: "4.5",
    category: "Transportation",
    meta: "48h pass",
    image:
      "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 23,
    title: "Tuk-tuk City Tour",
    location: "Alfama",
    price: "$40",
    rating: "4.6",
    category: "Transportation",
    meta: "1.5 hours",
    image:
      "https://images.unsplash.com/photo-1580654712603-eb43273aff33?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 24,
    title: "Car Rental",
    location: "LIS Airport",
    price: "$38",
    rating: "4.3",
    category: "Transportation",
    meta: "Per day",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
  },
]

const moods = [
  {
    title: "Food & culture",
    subtitle: "Taste the soul of Lisbon",
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

function ResultCard({
  item,
  saved,
  onSave,
}: {
  item: ExploreItem
  saved: boolean
  onSave: () => void
}) {
  // Mock items omit priceNote and keep the original suffix. Live dining
  // results pass an empty string, which hides it.
  const priceNote = item.priceNote ?? "/ person"

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-slate-100" />
        )}

        <button
          type="button"
          onClick={onSave}
          aria-label={`Save ${item.title}`}
          className="absolute right-2.5 top-2.5 rounded-full bg-white/95 p-1.5 shadow-sm"
        >
          <Heart
            className={`h-4 w-4 ${
              saved
                ? "fill-amber-400 text-amber-400"
                : "text-slate-700"
            }`}
          />
        </button>

        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {item.category}
        </span>
      </div>

      <div className="p-3.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
          {item.title}
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
          {[item.meta, item.location]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-3 flex items-end justify-between">
          {item.rating ? (
            <span className="flex items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {item.rating}
            </span>
          ) : (
            <span />
          )}

          <span className="text-sm font-bold text-slate-900">
            {item.price}
            {priceNote && (
              <small className="font-normal text-slate-500">
                {" "}
                {priceNote}
              </small>
            )}
          </span>
        </div>
      </div>
    </article>
  )
}

export default function ExploreTripPage() {
  const params = useParams<{ tripId: string }>()
  const tripId = params.tripId

  const [activeTab, setActiveTab] =
    useState<ExploreCategory>("All")

  const [saved, setSaved] = useState<(number | string)[]>([])

  // query drives the client side filter on the mock rows and updates as you
  // type. submittedQuery is what the API sees, and only changes on submit.
  const [query, setQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState("")

  // Mock sections collapse on their own when a tab filters them out, but live
  // ones have to be gated explicitly
  function isVisible(category: ExploreItem["category"]) {
    return activeTab === "All" || activeTab === category
  }

  // Hooks can't be called in a loop, so each live category gets its own call.
  // Adding Activities means one more line here and one more entry below.
  const dining = useExploreSearch(
    tripId,
    "Dining",
    submittedQuery,
    isVisible("Dining"),
  )

  const stays = useExploreSearch(
    tripId,
    "Stays",
    submittedQuery,
    isVisible("Stays"),
  )

  const activities = useExploreSearch(
    tripId,
    "Activities",
    submittedQuery,
    isVisible("Activities"),
  )

  const live: Partial<
    Record<ExploreItem["category"], typeof dining>
  > = {
    Dining: dining,
    Stays: stays,
    Activities: activities,
  }

  const liveItems = useMemo(() => {
    return {
      Dining: dining.widgets.map((w) =>
        widgetToExploreItem(w, "Dining"),
      ),
      Stays: stays.widgets.map((w) =>
        widgetToExploreItem(w, "Stays"),
      ),
      Activities: activities.widgets.map((w) =>
        widgetToExploreItem(w, "Activities"),
      ),
    } as Partial<Record<ExploreItem["category"], ExploreItem[]>>
  }, [dining.widgets, stays.widgets, activities.widgets])

  function handleSubmitQuery() {
    setSubmittedQuery(query.trim())
  }

  // The page level empty state should stay hidden while any live row still has
  // something to show or say
  const anyLiveContent = Object.values(live).some(
    (section) =>
      section &&
      (section.loading ||
        section.error ||
        section.widgets.length > 0),
  )

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesTab =
        activeTab === "All" ||
        item.category === activeTab

      const matchesQuery =
        `${item.title} ${item.location}`
          .toLowerCase()
          .includes(query.toLowerCase())

      return matchesTab && matchesQuery
    })
  }, [activeTab, query])

  const byCategory = (
    category: ExploreItem["category"],
  ) => {
    return filtered.filter(
      (item) => item.category === category,
    )
  }

  return (
    <main className="min-h-screen bg-[#fffdf9] text-slate-900">
      <section className="relative isolate min-h-[420px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=2000&q=90"
          alt="Lisbon skyline"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-transparent" />

        <div className="mx-auto flex min-h-[420px] max-w-7xl items-center px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-xl text-white">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Curated for your trip
            </span>

            <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-6xl">
              A long weekend,
              <br />
              beautifully planned.
            </h1>

            <p className="mt-4 max-w-md text-base text-white/85 sm:text-lg">
              Inspiring places and effortless planning,
              personalized to your itinerary.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-8 lg:px-10">
        <TripInfoBar
          tripId={tripId}
          activeCategory={activeTab}
          onCategoryChange={(category) => {
            setActiveTab(category)
          }}
          onSearch={() => {
            handleSubmitQuery()
          }}
        />
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-12 sm:px-8 lg:px-10">
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold">
                72 hours in Lisbon
              </h2>

              <p className="mt-1 text-slate-500">
                A locally inspired itinerary with flexibility
                built in.
              </p>
            </div>

            <button
              type="button"
              className="hidden items-center gap-1 text-sm font-semibold text-blue-700 sm:flex"
            >
              View trip
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.1fr_1fr_.8fr]">
            <img
              src="https://images.unsplash.com/photo-1555881400-69a2384ed1af?auto=format&fit=crop&w=1200&q=85"
              alt="Lisbon tram"
              className="h-full min-h-72 w-full object-cover"
            />

            <div className="space-y-5 p-6">
              {[
                {
                  day: "Day 1",
                  title: "Alfama neighborhood walk",
                  icon: MapPin,
                },
                {
                  day: "Day 2",
                  title: "Sintra day tour",
                  icon: Ticket,
                },
                {
                  day: "Day 3",
                  title: "Cascais beach & sunset",
                  icon: CarFront,
                },
              ].map(({ day, title, icon: Icon }) => (
                <div
                  key={day}
                  className="flex gap-4 border-b border-slate-100 pb-5 last:border-0"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100">
                    <Icon className="h-5 w-5 text-amber-700" />
                  </span>

                  <div>
                    <small className="text-slate-400">
                      {day}
                    </small>

                    <h3 className="font-semibold">
                      {title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Handpicked for your dates and travel
                      pace.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <aside className="bg-amber-50 p-6">
              <h3 className="font-serif text-2xl font-semibold">
                Make it bookable
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                We’ll handle the details so you can focus on
                the experience.
              </p>

              <div className="my-6 space-y-3 text-sm">
                <p className="flex justify-between">
                  <span>Stay</span>
                  <b>$1,125</b>
                </p>

                <p className="flex justify-between">
                  <span>Activities</span>
                  <b>$323</b>
                </p>

                <p className="flex justify-between border-t border-amber-200 pt-3">
                  <span>Estimated total</span>
                  <b>$1,448</b>
                </p>
              </div>

              <button
                type="button"
                className="w-full rounded-xl bg-amber-400 py-3 font-bold hover:bg-amber-300"
              >
                Customize this trip
              </button>
            </aside>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <h2 className="font-serif text-3xl font-semibold">
              Choose your travel mood
            </h2>

            <p className="mt-1 text-slate-500">
              Not sure what you’re in the mood for? Let’s
              inspire you.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {moods.map((mood) => (
              <button
                key={mood.title}
                type="button"
                className="group relative min-h-56 overflow-hidden rounded-2xl text-left text-white"
              >
                <img
                  src={mood.image}
                  alt={mood.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <span className="absolute bottom-5 left-5">
                  <b className="block text-xl">
                    {mood.title}
                  </b>

                  <small className="text-white/80">
                    {mood.subtitle}
                  </small>
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
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search within your trip recommendations, then press Enter"
            className="w-full bg-transparent text-sm outline-none"
          />
        </form>

        {(
          [
            "Stays",
            "Activities",
            "Dining",
            "Transportation",
          ] as const
        ).map((category) => {
          const liveData = live[category]

          const categoryItems = liveData
            ? liveItems[category] ?? []
            : byCategory(category)

          // Live sections render their own loading and error states, so they
          // stay mounted even with nothing to show yet
          if (!liveData && !categoryItems.length) {
            return null
          }

          if (liveData && !isVisible(category)) {
            return null
          }

          const icons = {
            Stays: BedDouble,
            Activities: Ticket,
            Dining: Utensils,
            Transportation: CarFront,
          }

          const Icon = icons[category]

          let sectionBody = (
            <div className={CARD_GRID}>
              {categoryItems.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  saved={saved.includes(item.id)}
                  onSave={() => {
                    setSaved((current) =>
                      current.includes(item.id)
                        ? current.filter(
                            (id) => id !== item.id,
                          )
                        : [...current, item.id],
                    )
                  }}
                />
              ))}
            </div>
          )

          if (liveData) {
            if (liveData.error) {
              sectionBody = (
                <ErrorBlock
                  message={liveData.error}
                  onRetry={liveData.retry}
                />
              )
            } else if (liveData.loading) {
              sectionBody = <SkeletonGrid />
            } else if (!categoryItems.length) {
              sectionBody = (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                  No results for this search.
                </div>
              )
            }
          }

          return (
            <section key={category}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-serif text-3xl font-semibold">
                    <Icon className="h-6 w-6 text-slate-500" />

                    {category === "Stays"
                      ? "Standout stays"
                      : category === "Activities"
                        ? "Things to do"
                        : category === "Dining"
                          ? "Dining favorites"
                          : "Getting around"}
                  </h2>

                  <p className="mt-1 text-slate-500">
                    Recommended for your trip itinerary.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab(category)}
                  className="flex items-center gap-1 text-sm font-semibold text-blue-700"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {sectionBody}
            </section>
          )
        })}

        {!filtered.length && !anyLiveContent && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-slate-400" />

            <h2 className="mt-3 text-xl font-semibold">
              No recommendations found
            </h2>

            <p className="mt-1 text-slate-500">
              Try another search or category.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}