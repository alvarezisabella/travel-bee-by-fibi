export type ExploreCategory =
  | "All"
  | "Activities"
  | "Stays"
  | "Transportation"
  | "Dining"

export type ExploreItemCategory = Exclude<
  ExploreCategory,
  "All"
>

export type ExplorePriceUnit =
  | "person"
  | "night"
  | "ride"
  | "day"
  | "ticket"
  | "reservation"

export interface ExploreItem {
  id: string
  title: string
  description: string
  location: string
  category: ExploreItemCategory

  image: string
  images?: string[]

  rating: number
  reviewCount?: number

  price: number
  currency: "USD"
  priceUnit: ExplorePriceUnit

  duration?: string
  provider?: string

  latitude: number
  longitude: number

  tags?: string[]
  featured?: boolean
}

export interface ExploreTripInfo {
  location: string
  startDate: string
  endDate: string
  travelerCount: number
}

export type ExploreSortOption =
  | "recommended"
  | "rating"
  | "price-low"
  | "price-high"

export interface ExploreFilters {
  category: ExploreCategory
  query: string
  sort: ExploreSortOption
  minimumRating: number | null
  minimumPrice: number | null
  maximumPrice: number | null
}

export interface ExploreSearchState {
  results: ExploreItem[]
  selectedItemId: string | null
  savedItemIds: string[]
  loading: boolean
  error: string | null
}