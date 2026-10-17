
export type MoodCategory =
  | "Relax & Recharge"
  | "Adventure"
  | "Culture & Discovery"
  | "Social & Entertainment"
  | "Luxury & Romance"

export type MoodExploreCategory =
  | "Activities"
  | "Dining"
  | "Stays"
  | "Transportation"

export interface TravelMood {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  image: string
  heroImage: string
  icon: string
  category: MoodCategory
  featured: boolean
  keywords: string[]
  searchQueries: Record<MoodExploreCategory, string[]>
}

export const moodCategories: Array<
  MoodCategory | "All Moods"
> = [
  "All Moods",
  "Relax & Recharge",
  "Adventure",
  "Culture & Discovery",
  "Social & Entertainment",
  "Luxury & Romance",
]

export const travelMoods: TravelMood[] = [
  {
    id: "food-culture",
    slug: "food-culture",
    title: "Food & Culture",
    subtitle: "Taste the soul of your destination",
    description:
      "Experience authentic flavors, local traditions, historic neighborhoods, and the stories behind every destination.",
    image:
      "https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1800&q=90",
    icon: "utensils",
    category: "Culture & Discovery",
    featured: true,
    keywords: [
      "food",
      "culture",
      "restaurants",
      "markets",
      "history",
      "cooking",
    ],
    searchQueries: {
      Activities: [
        "local food tours",
        "cooking classes",
        "cultural experiences",
        "historic walking tours",
      ],
      Dining: [
        "authentic local restaurants",
        "traditional cuisine",
        "food markets",
        "local specialty restaurants",
      ],
      Stays: [
        "boutique hotels historic center",
        "heritage hotels",
        "cultural district hotels",
      ],
      Transportation: [
        "historic tram tours",
        "sightseeing bike rentals",
        "city walking tour transportation",
      ],
    },
  },
  {
    id: "coast-calm",
    slug: "coast-calm",
    title: "Coast & Calm",
    subtitle: "Relax and recharge",
    description:
      "Escape to beautiful coastlines, quiet waterfront retreats, sunset cruises, and peaceful experiences.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=90",
    icon: "waves",
    category: "Relax & Recharge",
    featured: true,
    keywords: [
      "beach",
      "coast",
      "relax",
      "cruise",
      "waterfront",
    ],
    searchQueries: {
      Activities: [
        "sunset cruises",
        "scenic coastal tours",
        "beach activities",
        "relaxing boat trips",
      ],
      Dining: [
        "oceanfront restaurants",
        "beachside cafes",
        "waterfront brunch restaurants",
      ],
      Stays: [
        "beachfront hotels",
        "ocean view resorts",
        "quiet coastal hotels",
      ],
      Transportation: [
        "coastal bike rentals",
        "beach shuttle services",
        "private coastal transfers",
      ],
    },
  },
  {
    id: "nightlife",
    slug: "nightlife",
    title: "Nightlife",
    subtitle: "Sip, dance, and explore",
    description:
      "Discover rooftop bars, live music, exciting entertainment, and unforgettable experiences after dark.",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=90",
    icon: "music",
    category: "Social & Entertainment",
    featured: true,
    keywords: [
      "nightlife",
      "bars",
      "music",
      "clubs",
      "concerts",
    ],
    searchQueries: {
      Activities: [
        "live music venues",
        "nightclubs",
        "evening entertainment",
        "night tours",
      ],
      Dining: [
        "rooftop cocktail bars",
        "late night restaurants",
        "dinner with live music",
      ],
      Stays: [
        "hotels near nightlife district",
        "central boutique hotels",
        "rooftop bar hotels",
      ],
      Transportation: [
        "private evening car service",
        "late night shuttle services",
        "taxi services",
      ],
    },
  },
  {
    id: "adventure-outdoors",
    slug: "adventure-outdoors",
    title: "Adventure & Outdoors",
    subtitle: "Go beyond the ordinary",
    description:
      "Explore scenic trails, exciting outdoor excursions, thrilling activities, and unforgettable adventures.",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=90",
    icon: "mountain",
    category: "Adventure",
    featured: false,
    keywords: ["hiking", "outdoors", "adventure", "sports"],
    searchQueries: {
      Activities: [
        "guided hiking tours",
        "outdoor adventure experiences",
        "kayaking tours",
        "zipline adventures",
      ],
      Dining: [
        "mountain view restaurants",
        "outdoor cafes",
        "trailhead restaurants",
      ],
      Stays: [
        "mountain lodges",
        "adventure resorts",
        "nature cabins",
      ],
      Transportation: [
        "outdoor adventure shuttle",
        "4x4 vehicle rentals",
        "bike rentals",
      ],
    },
  },
  {
    id: "luxury-indulgence",
    slug: "luxury-indulgence",
    title: "Luxury & Indulgence",
    subtitle: "Travel beautifully",
    description:
      "Enjoy exceptional hotels, exclusive experiences, fine dining, and beautifully curated luxury escapes.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=90",
    icon: "gem",
    category: "Luxury & Romance",
    featured: false,
    keywords: ["luxury", "fine dining", "exclusive", "resort"],
    searchQueries: {
      Activities: [
        "private luxury tours",
        "exclusive experiences",
        "private yacht cruises",
      ],
      Dining: [
        "fine dining restaurants",
        "tasting menu restaurants",
        "luxury rooftop dining",
      ],
      Stays: [
        "five star luxury hotels",
        "premium resorts",
        "luxury boutique hotels",
      ],
      Transportation: [
        "private chauffeur service",
        "luxury car rentals",
        "executive airport transfers",
      ],
    },
  },
  {
    id: "romantic-getaway",
    slug: "romantic-getaway",
    title: "Romantic Getaway",
    subtitle: "Make unforgettable memories",
    description:
      "Find intimate dining spots, dreamy accommodations, sunset experiences, and meaningful moments together.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=90",
    icon: "heart",
    category: "Luxury & Romance",
    featured: false,
    keywords: ["romance", "couples", "sunset", "date night"],
    searchQueries: {
      Activities: [
        "romantic sunset cruises",
        "couples experiences",
        "private scenic tours",
      ],
      Dining: [
        "romantic dinner restaurants",
        "candlelight dining",
        "restaurants with scenic views",
      ],
      Stays: [
        "romantic boutique hotels",
        "couples resorts",
        "romantic suites",
      ],
      Transportation: [
        "private chauffeur tours",
        "romantic carriage rides",
        "private transfers",
      ],
    },
  },
  {
    id: "wellness-relaxation",
    slug: "wellness-relaxation",
    title: "Wellness & Relaxation",
    subtitle: "Restore your balance",
    description:
      "Recharge through spa retreats, peaceful settings, yoga experiences, and restorative escapes.",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1800&q=90",
    icon: "flower",
    category: "Relax & Recharge",
    featured: false,
    keywords: ["wellness", "spa", "yoga", "relaxation"],
    searchQueries: {
      Activities: [
        "day spas",
        "yoga classes",
        "wellness retreats",
        "massage experiences",
      ],
      Dining: [
        "healthy restaurants",
        "organic cafes",
        "wellness dining",
      ],
      Stays: [
        "spa resorts",
        "wellness retreat hotels",
        "quiet luxury hotels",
      ],
      Transportation: [
        "private resort transfers",
        "wellness retreat shuttle",
        "private car service",
      ],
    },
  },
  {
    id: "history-heritage",
    slug: "history-heritage",
    title: "History & Heritage",
    subtitle: "Step into the past",
    description:
      "Discover extraordinary architecture, historic landmarks, museums, and the stories that shaped a place.",
    image:
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=85",
    heroImage:
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1800&q=90",    icon: "landmark",
    category: "Culture & Discovery",
    featured: false,
    keywords: ["history", "museum", "heritage", "landmarks"],
    searchQueries: {
      Activities: [
        "historical landmarks",
        "museum tours",
        "heritage walking tours",
        "historic architecture tours",
      ],
      Dining: [
        "traditional historic restaurants",
        "heritage dining",
        "old town restaurants",
      ],
      Stays: [
        "historic hotels",
        "heritage boutique hotels",
        "old town accommodation",
      ],
      Transportation: [
        "historic sightseeing tours",
        "heritage tram rides",
        "city sightseeing buses",
      ],
    },
  },
  {
    id: "nature-wildlife",
    slug: "nature-wildlife",
    title: "Nature & Wildlife",
    subtitle: "Reconnect with the wild",
    description:
      "Explore spectacular landscapes, peaceful natural settings, national parks, and wildlife experiences.",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=90",
    icon: "trees",
    category: "Adventure",
    featured: false,
    keywords: ["nature", "wildlife", "parks", "forest"],
    searchQueries: {
      Activities: [
        "nature tours",
        "wildlife watching experiences",
        "national park tours",
        "botanical gardens",
      ],
      Dining: [
        "garden restaurants",
        "nature view cafes",
        "farm to table restaurants",
      ],
      Stays: [
        "nature lodges",
        "eco resorts",
        "forest cabins",
      ],
      Transportation: [
        "national park shuttle",
        "nature tour transportation",
        "bike rentals",
      ],
    },
  },
  {
    id: "city-explorer",
    slug: "city-explorer",
    title: "City Explorer",
    subtitle: "Discover every corner",
    description:
      "Dive into vibrant streets, iconic sights, hidden boutiques, local cafés, and neighborhoods full of character.",
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1800&q=90",
    icon: "building",
    category: "Culture & Discovery",
    featured: false,
    keywords: ["city", "urban", "shopping", "sightseeing"],
    searchQueries: {
      Activities: [
        "city sightseeing tours",
        "neighborhood walking tours",
        "iconic attractions",
      ],
      Dining: [
        "popular city restaurants",
        "local coffee shops",
        "trendy neighborhood dining",
      ],
      Stays: [
        "city center hotels",
        "boutique downtown hotels",
        "design hotels",
      ],
      Transportation: [
        "city bike rentals",
        "sightseeing bus tours",
        "public transit passes",
      ],
    },
  },
  {
    id: "fun-entertainment",
    slug: "fun-entertainment",
    title: "Fun & Entertainment",
    subtitle: "Make every moment count",
    description:
      "Fill your getaway with attractions, live shows, interactive experiences, and exciting entertainment.",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=90",
    icon: "party",
    category: "Social & Entertainment",
    featured: false,
    keywords: ["fun", "entertainment", "shows", "attractions"],
    searchQueries: {
      Activities: [
        "amusement parks",
        "interactive attractions",
        "live entertainment shows",
        "escape rooms",
      ],
      Dining: [
        "fun themed restaurants",
        "dinner shows",
        "entertainment restaurants",
      ],
      Stays: [
        "hotels near entertainment district",
        "family entertainment resorts",
        "central hotels",
      ],
      Transportation: [
        "attraction shuttle services",
        "theme park transfers",
        "city sightseeing buses",
      ],
    },
  },
  {
    id: "road-trip-discovery",
    slug: "road-trip-discovery",
    title: "Road Trip & Discovery",
    subtitle: "Follow the open road",
    description:
      "Explore scenic drives, charming small towns, hidden stops, and incredible places along the way.",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",
    heroImage:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=90",
    icon: "car",
    category: "Adventure",
    featured: false,
    keywords: ["road trip", "scenic drive", "discovery"],
    searchQueries: {
      Activities: [
        "scenic road trip attractions",
        "roadside landmarks",
        "nearby day trips",
      ],
      Dining: [
        "scenic roadside restaurants",
        "local diners",
        "countryside cafes",
      ],
      Stays: [
        "scenic countryside hotels",
        "road trip motels",
        "boutique roadside hotels",
      ],
      Transportation: [
        "car rentals",
        "camper van rentals",
        "private drivers",
      ],
    },
  },
]

export function getTravelMood(
  slug: string,
): TravelMood | undefined {
  return travelMoods.find(
    (mood) => mood.slug === slug,
  )
}

export function getFeaturedTravelMoods(): TravelMood[] {
  return travelMoods.filter((mood) => mood.featured)
}

export function getTravelMoodsByCategory(
  category: MoodCategory | "All Moods",
): TravelMood[] {
  if (category === "All Moods") {
    return travelMoods
  }

  return travelMoods.filter(
    (mood) => mood.category === category,
  )
}
