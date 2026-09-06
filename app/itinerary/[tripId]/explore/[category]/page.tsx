"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  ArrowLeft,
  BedDouble,
  CarFront,
  Ticket,
  Utensils,
} from "lucide-react"
import Link from "next/link"
import {
  useParams,
  useRouter,
} from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Widget } from "@/app/itinerary/types/types"
import TripInfoBar, {
  type ExploreCategory,
  type ExploreTripInfo,
} from "../components/TripInfoBar"
import CategoryPageLayout from "../components/CategoryPageLayout"
import { useExploreSearch } from "../useExploreSearch"

const transportationItems: Widget[] = [
  {
    id: "transport-lisbon-card",
    title: "Lisbon Card 72h",
    location: "Citywide",
    description: "Transit and attractions",
    type: "Transit",
    image_url:
      "https://images.unsplash.com/photo-1525207934214-58e69a8f8a93?auto=format&fit=crop&w=900&q=85",
    rating: 4.8,
    price: 46,
  },
  {
    id: "transport-airport-transfer",
    title: "Private Airport Transfer",
    location: "Airport",
    description:
      "Private door-to-door transportation",
    type: "Transit",
    image_url:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=85",
    rating: 4.6,
    price: 55,
  },
  {
    id: "transport-public-pass",
    title: "24h Public Transport Pass",
    location: "Citywide",
    description: "Metro, bus, and tram",
    type: "Transit",
    image_url:
      "https://images.unsplash.com/photo-1555881400-69a2384ed1af?auto=format&fit=crop&w=900&q=85",
    rating: 4.4,
    price: 12,
  },
  {
    id: "transport-hop-on-bus",
    title: "Hop-on Hop-off Bus",
    location: "Citywide",
    description: "48-hour sightseeing pass",
    type: "Transit",
    image_url:
      "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=900&q=85",
    rating: 4.5,
    price: 32,
  },
  {
    id: "transport-tuk-tuk",
    title: "Tuk-tuk City Tour",
    location: "Historic center",
    description: "Private 1.5-hour city tour",
    type: "Transit",
    image_url:
      "https://images.unsplash.com/photo-1580654712603-eb43273aff33?auto=format&fit=crop&w=900&q=85",
    rating: 4.6,
    price: 40,
  },
  {
    id: "transport-car-rental",
    title: "Car Rental",
    location: "Airport",
    description: "Flexible daily rental",
    type: "Transit",
    image_url:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
    rating: 4.3,
    price: 38,
  },
]

const categoryInformation = {
  stays: {
    category: "Stays",
    title: "Standout stays",
    subtitle:
      "Hotels and accommodations recommended for your trip.",
    icon: BedDouble,
  },
  activities: {
    category: "Activities",
    title: "Things to do",
    subtitle:
      "Activities, attractions, and experiences for your itinerary.",
    icon: Ticket,
  },
  dining: {
    category: "Dining",
    title: "Dining favorites",
    subtitle:
      "Restaurants and dining experiences near your destination.",
    icon: Utensils,
  },
  transportation: {
    category: "Transportation",
    title: "Getting around",
    subtitle:
      "Transportation options for a smoother trip.",
    icon: CarFront,
  },
} as const

type CategorySlug =
  keyof typeof categoryInformation

function isCategorySlug(
  value: string,
): value is CategorySlug {
  return value in categoryInformation
}

export default function ExploreCategoryPage() {
  const params = useParams<{
    tripId: string
    category: string
  }>()

  const router = useRouter()

  const tripId = params.tripId
  const categorySlug =
    params.category.toLowerCase()

  const validCategory =
    isCategorySlug(categorySlug)

  const categoryDetails = validCategory
    ? categoryInformation[categorySlug]
    : null

  const activeCategory: ExploreCategory =
    categoryDetails?.category ?? "All"

  const isTransportation =
    activeCategory === "Transportation"

  const [location, setLocation] =
    useState("")

  const [tripLoading, setTripLoading] =
    useState(true)

  const [query, setQuery] = useState("")

  const [
    submittedQuery,
    setSubmittedQuery,
  ] = useState("")

  const [
    selectedWidgetId,
    setSelectedWidgetId,
  ] = useState<string | null>(null)

  const [
    savedWidgetIds,
    setSavedWidgetIds,
  ] = useState<string[]>([])

  const search = useExploreSearch(
    tripId,
    activeCategory,
    submittedQuery,
    validCategory && !isTransportation,
  )

  const transportationResults =
    useMemo(() => {
      if (!isTransportation) {
        return []
      }

      const normalizedQuery =
        submittedQuery
          .trim()
          .toLowerCase()

      if (!normalizedQuery) {
        return transportationItems
      }

      return transportationItems.filter(
        (widget) =>
          `${widget.title} ${widget.location ?? ""} ${widget.description ?? ""}`
            .toLowerCase()
            .includes(normalizedQuery),
      )
    }, [
      isTransportation,
      submittedQuery,
    ])

  const widgets = isTransportation
    ? transportationResults
    : search.widgets

  const loading = isTransportation
    ? false
    : search.loading

  const searchError = isTransportation
    ? null
    : search.error

  useEffect(() => {
    if (!validCategory) {
      router.replace(
        `/itinerary/${tripId}/explore`,
      )
    }
  }, [
    router,
    tripId,
    validCategory,
  ])

  useEffect(() => {
    if (!tripId || !validCategory) {
      return
    }

    let ignore = false

    async function loadItinerary() {
      setTripLoading(true)

      const supabase = createClient()

      const { data, error } =
        await supabase
          .from("itineraries")
          .select("location")
          .eq("id", tripId)
          .single()

      if (ignore) {
        return
      }

      if (!error) {
        setLocation(
          data?.location ?? "",
        )
      }

      setTripLoading(false)
    }

    loadItinerary()

    return () => {
      ignore = true
    }
  }, [tripId, validCategory])

  useEffect(() => {
    if (
      widgets.length > 0 &&
      !selectedWidgetId
    ) {
      setSelectedWidgetId(
        widgets[0].id,
      )
    }
  }, [
    widgets,
    selectedWidgetId,
  ])

  useEffect(() => {
    try {
      const storedValue =
        window.localStorage.getItem(
          `travelbee-explore-saved-${tripId}`,
        )

      if (!storedValue) {
        return
      }

      const parsedValue =
        JSON.parse(storedValue)

      if (Array.isArray(parsedValue)) {
        setSavedWidgetIds(
          parsedValue.filter(
            (
              value,
            ): value is string =>
              typeof value === "string",
          ),
        )
      }
    } catch {
      setSavedWidgetIds([])
    }
  }, [tripId])

  const selectedWidget =
    useMemo(() => {
      return (
        widgets.find(
          (widget) =>
            widget.id ===
            selectedWidgetId,
        ) ?? null
      )
    }, [
      widgets,
      selectedWidgetId,
    ])

  function toggleSavedWidget(
    widget: Widget,
  ) {
    setSavedWidgetIds((current) => {
      const updated = current.includes(
        widget.id,
      )
        ? current.filter(
            (id) => id !== widget.id,
          )
        : [...current, widget.id]

      try {
        window.localStorage.setItem(
          `travelbee-explore-saved-${tripId}`,
          JSON.stringify(updated),
        )
      } catch {
        // Continue if local storage is unavailable.
      }

      return updated
    })
  }

  function handleCategoryChange(
    category: ExploreCategory,
  ) {
    if (category === "All") {
      router.push(
        `/itinerary/${tripId}/explore`,
      )
      return
    }

    router.push(
      `/itinerary/${tripId}/explore/${category.toLowerCase()}`,
    )
  }

  function runSearch() {
    setSubmittedQuery(query.trim())
    setSelectedWidgetId(null)
  }

  function handleTripSearch(
    tripInfo: ExploreTripInfo,
  ) {
    setLocation(tripInfo.location)
    runSearch()
  }

  function handleAddWidget(
    widget: Widget,
  ) {
    setSelectedWidgetId(widget.id)

    window.alert(
      `${widget.title} is ready to be added to your itinerary.`,
    )
  }

  if (
    !validCategory ||
    !categoryDetails
  ) {
    return null
  }

  const CategoryIcon =
    categoryDetails.icon

  return (
    <main className="min-h-screen bg-[#fffdf9] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1800px] items-center gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href={`/itinerary/${tripId}/explore`}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>

          <span className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <CategoryIcon className="h-5 w-5 text-amber-600" />

            <span className="font-semibold text-slate-900">
              {categoryDetails.title}
            </span>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-100 bg-gradient-to-b from-white to-amber-50/40">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-7 sm:px-8 lg:px-10">
          <TripInfoBar
            tripId={tripId}
            activeCategory={
              activeCategory
            }
            onCategoryChange={
              handleCategoryChange
            }
            onSearch={
              handleTripSearch
            }
          />

          <form
            onSubmit={(event) => {
              event.preventDefault()
              runSearch()
            }}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
          >
            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder={`Search ${activeCategory.toLowerCase()} by name, neighborhood, or preference`}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
            />

            <button
              type="submit"
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1800px] px-5 py-8 sm:px-8 lg:px-10">
        <CategoryPageLayout
          title={categoryDetails.title}
          subtitle={
            categoryDetails.subtitle
          }
          location={location}
          widgets={widgets}
          loading={
            tripLoading || loading
          }
          error={searchError}
          selectedWidgetId={
            selectedWidget?.id ?? null
          }
          savedWidgetIds={
            savedWidgetIds
          }
          onSelectWidget={(widget) =>
            setSelectedWidgetId(
              widget.id,
            )
          }
          onToggleSaved={
            toggleSavedWidget
          }
          onAddWidget={
            handleAddWidget
          }
          onRetry={() => {
            if (isTransportation) {
              runSearch()
            } else {
              search.retry()
            }
          }}
          onSearchArea={() => {
            if (!isTransportation) {
              search.retry()
            }
          }}
        />
      </div>
    </main>
  )
}