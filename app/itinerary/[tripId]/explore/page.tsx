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

type ExploreItem = {
  id: number
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
}

const items: ExploreItem[] = [
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
    id: 4,
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
    id: 5,
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
    id: 6,
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
    id: 7,
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
    id: 8,
    title: "Lisbon Card 72h",
    location: "Citywide",
    price: "$46",
    rating: "4.8",
    category: "Transportation",
    meta: "Transit + attractions",
    image:
      "https://images.unsplash.com/photo-1525207934214-58e69a8f8a93?auto=format&fit=crop&w=900&q=85",
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
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <button
          type="button"
          onClick={onSave}
          aria-label={`Save ${item.title}`}
          className="absolute right-3 top-3 rounded-full bg-white/95 p-2 shadow-sm"
        >
          <Heart
            className={`h-4 w-4 ${
              saved
                ? "fill-amber-400 text-amber-400"
                : "text-slate-700"
            }`}
          />
        </button>

        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {item.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-slate-900">
          {item.title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {item.meta} · {item.location}
        </p>

        <div className="mt-4 flex items-end justify-between">
          <span className="flex items-center gap-1 text-sm font-medium">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {item.rating}
          </span>

          <span className="font-bold text-slate-900">
            {item.price}
            <small className="font-normal text-slate-500">
              {" "}
              / person
            </small>
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

  const [saved, setSaved] = useState<number[]>([])
  const [query, setQuery] = useState("")

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
          onSearch={(tripInfo) => {
            console.log("Searching Explore with:", {
              tripId,
              category: activeTab,
              destination: tripInfo.location,
              startDate: tripInfo.startDate,
              endDate: tripInfo.endDate,
              travelers: tripInfo.travelerCount,
            })
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

        <label className="mx-auto flex max-w-2xl items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <Search className="h-5 w-5 text-slate-400" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search within your trip recommendations"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        {(
          [
            "Stays",
            "Activities",
            "Dining",
            "Transportation",
          ] as const
        ).map((category) => {
          const categoryItems = byCategory(category)

          if (!categoryItems.length) {
            return null
          }

          const icons = {
            Stays: BedDouble,
            Activities: Ticket,
            Dining: Utensils,
            Transportation: CarFront,
          }

          const Icon = icons[category]

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

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            </section>
          )
        })}

        {!filtered.length && (
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