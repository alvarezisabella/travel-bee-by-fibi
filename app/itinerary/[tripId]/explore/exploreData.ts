import type { ExploreItem } from "./types"

export const exploreItems: ExploreItem[] = [
  // -------------------------
  // Stays
  // -------------------------
  {
    id: "memmo-alfama-hotel",
    title: "Memmo Alfama Hotel",
    description:
      "A boutique hotel with elegant rooms, a rooftop terrace, and sweeping views of the Tagus River.",
    location: "Alfama, Lisbon",
    category: "Stays",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
    rating: 4.7,
    reviewCount: 1248,
    price: 212,
    currency: "USD",
    priceUnit: "night",
    provider: "TravelBee Stays",
    latitude: 38.7115,
    longitude: -9.1283,
    tags: ["Boutique hotel", "Rooftop", "River views"],
    featured: true,
  },
  {
    id: "bairro-alto-hotel",
    title: "Bairro Alto Hotel",
    description:
      "A refined central hotel near Lisbon’s best cafés, shops, nightlife, and historic neighborhoods.",
    location: "Bairro Alto, Lisbon",
    category: "Stays",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8,
    reviewCount: 936,
    price: 285,
    currency: "USD",
    priceUnit: "night",
    provider: "TravelBee Stays",
    latitude: 38.7107,
    longitude: -9.1437,
    tags: ["Luxury", "Central location", "Rooftop"],
    featured: true,
  },
  {
    id: "lisboa-pessoa-hotel",
    title: "Lisboa Pessoa Hotel",
    description:
      "A stylish literary-inspired stay with an indoor pool, spa, and panoramic city views.",
    location: "Chiado, Lisbon",
    category: "Stays",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=85",
    rating: 4.6,
    reviewCount: 782,
    price: 179,
    currency: "USD",
    priceUnit: "night",
    provider: "TravelBee Stays",
    latitude: 38.7128,
    longitude: -9.1415,
    tags: ["Spa", "Indoor pool", "City views"],
  },
  {
    id: "santiago-de-alfama",
    title: "Santiago de Alfama",
    description:
      "A restored historic residence offering intimate rooms and a peaceful setting in old Lisbon.",
    location: "Alfama, Lisbon",
    category: "Stays",
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85",
    rating: 4.9,
    reviewCount: 516,
    price: 264,
    currency: "USD",
    priceUnit: "night",
    provider: "TravelBee Stays",
    latitude: 38.7119,
    longitude: -9.1306,
    tags: ["Historic", "Quiet", "Boutique hotel"],
  },

  // -------------------------
  // Activities
  // -------------------------
  {
    id: "sintra-cascais-day-tour",
    title: "Sintra Palace & Coast Day Tour",
    description:
      "Visit Pena Palace, explore historic Sintra, and follow the coast through Cabo da Roca and Cascais.",
    location: "Sintra and Cascais",
    category: "Activities",
    image:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=85",
    rating: 4.9,
    reviewCount: 2891,
    price: 89,
    currency: "USD",
    priceUnit: "person",
    duration: "8 hours",
    provider: "Lisbon Local Tours",
    latitude: 38.7876,
    longitude: -9.3909,
    tags: ["Day trip", "Palaces", "Coast"],
    featured: true,
  },
  {
    id: "alfama-walking-tour",
    title: "Alfama History Walking Tour",
    description:
      "Explore Lisbon’s oldest neighborhood through hidden lanes, viewpoints, tiled homes, and local stories.",
    location: "Alfama, Lisbon",
    category: "Activities",
    image:
      "https://images.unsplash.com/photo-1525207934214-58e69a8f8a93?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8,
    reviewCount: 1347,
    price: 34,
    currency: "USD",
    priceUnit: "person",
    duration: "3 hours",
    provider: "Lisbon Walks",
    latitude: 38.7126,
    longitude: -9.1291,
    tags: ["Walking tour", "History", "Local guide"],
  },
  {
    id: "tagus-sunset-cruise",
    title: "Tagus River Sunset Cruise",
    description:
      "Cruise past Belém Tower and Lisbon’s riverfront while watching the sun set over the city.",
    location: "Cais do Sodré, Lisbon",
    category: "Activities",
    image:
      "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?auto=format&fit=crop&w=1200&q=85",
    rating: 4.7,
    reviewCount: 963,
    price: 48,
    currency: "USD",
    priceUnit: "person",
    duration: "2 hours",
    provider: "Tagus Sailing",
    latitude: 38.7058,
    longitude: -9.1448,
    tags: ["Sunset", "River cruise", "Scenic"],
  },
  {
    id: "belem-monuments-tour",
    title: "Belém Monuments & Pastry Tour",
    description:
      "Discover Lisbon’s maritime history and finish with an authentic pastel de nata tasting.",
    location: "Belém, Lisbon",
    category: "Activities",
    image:
      "https://images.unsplash.com/photo-1555881400-69a2384ed1af?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8,
    reviewCount: 718,
    price: 42,
    currency: "USD",
    priceUnit: "person",
    duration: "3.5 hours",
    provider: "Taste of Lisbon",
    latitude: 38.6977,
    longitude: -9.2064,
    tags: ["Food", "History", "Walking tour"],
  },

  // -------------------------
  // Dining
  // -------------------------
  {
    id: "cervejaria-ramiro",
    title: "Cervejaria Ramiro",
    description:
      "A lively Lisbon institution known for fresh seafood, garlic prawns, crab, and local favorites.",
    location: "Intendente, Lisbon",
    category: "Dining",
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85",
    rating: 4.6,
    reviewCount: 12702,
    price: 45,
    currency: "USD",
    priceUnit: "person",
    provider: "TravelBee Dining",
    latitude: 38.7221,
    longitude: -9.1353,
    tags: ["Seafood", "Local favorite", "Casual"],
    featured: true,
  },
  {
    id: "time-out-market-lisboa",
    title: "Time Out Market Lisboa",
    description:
      "Sample dishes from several of Lisbon’s best-known chefs and restaurants in one vibrant food hall.",
    location: "Cais do Sodré, Lisbon",
    category: "Dining",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85",
    rating: 4.5,
    reviewCount: 8436,
    price: 32,
    currency: "USD",
    priceUnit: "person",
    provider: "TravelBee Dining",
    latitude: 38.7068,
    longitude: -9.1455,
    tags: ["Food hall", "Casual", "Local chefs"],
  },
  {
    id: "bairro-do-avillez",
    title: "Bairro do Avillez",
    description:
      "Creative Portuguese cooking served in a relaxed and stylish restaurant in the heart of Chiado.",
    location: "Chiado, Lisbon",
    category: "Dining",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85",
    rating: 4.7,
    reviewCount: 2941,
    price: 68,
    currency: "USD",
    priceUnit: "person",
    provider: "TravelBee Dining",
    latitude: 38.7108,
    longitude: -9.1432,
    tags: ["Portuguese", "Chef-led", "Dinner"],
  },
  {
    id: "fado-dinner-alfama",
    title: "Traditional Fado Dinner",
    description:
      "Enjoy classic Portuguese dishes accompanied by an intimate live Fado performance.",
    location: "Alfama, Lisbon",
    category: "Dining",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8,
    reviewCount: 1109,
    price: 75,
    currency: "USD",
    priceUnit: "person",
    duration: "3 hours",
    provider: "Alfama Nights",
    latitude: 38.7111,
    longitude: -9.1274,
    tags: ["Fado", "Portuguese", "Live music"],
  },

  // -------------------------
  // Transportation
  // -------------------------
  {
    id: "lisbon-airport-transfer",
    title: "Private Lisbon Airport Transfer",
    description:
      "A comfortable private transfer between Lisbon Airport and your accommodation with flight monitoring.",
    location: "Lisbon Airport",
    category: "Transportation",
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85",
    rating: 4.9,
    reviewCount: 986,
    price: 38,
    currency: "USD",
    priceUnit: "ride",
    duration: "Approximately 30 minutes",
    provider: "Lisbon Private Transfers",
    latitude: 38.7742,
    longitude: -9.1342,
    tags: ["Private", "Airport", "Door-to-door"],
    featured: true,
  },
  {
    id: "lisbon-card-72-hour",
    title: "Lisbon Card — 72 Hours",
    description:
      "Unlimited public transportation plus admission and discounts at popular Lisbon attractions.",
    location: "Lisbon",
    category: "Transportation",
    image:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=85",
    rating: 4.7,
    reviewCount: 3218,
    price: 46,
    currency: "USD",
    priceUnit: "person",
    duration: "72 hours",
    provider: "Lisboa Card",
    latitude: 38.7139,
    longitude: -9.1394,
    tags: ["Public transit", "Attractions", "City pass"],
  },
  {
    id: "sintra-private-driver",
    title: "Private Driver to Sintra",
    description:
      "Travel to Sintra in a private vehicle with flexible pickup, return time, and sightseeing stops.",
    location: "Lisbon to Sintra",
    category: "Transportation",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8,
    reviewCount: 604,
    price: 165,
    currency: "USD",
    priceUnit: "ride",
    duration: "8 hours",
    provider: "Portugal Private Drivers",
    latitude: 38.7402,
    longitude: -9.1971,
    tags: ["Private driver", "Day trip", "Flexible"],
  },
  {
    id: "lisbon-electric-bike",
    title: "Lisbon Electric Bike Rental",
    description:
      "Explore Lisbon’s neighborhoods and viewpoints with a comfortable electric bicycle.",
    location: "Baixa, Lisbon",
    category: "Transportation",
    image:
      "https://images.unsplash.com/photo-1529422643029-d4585747aaf2?auto=format&fit=crop&w=1200&q=85",
    rating: 4.6,
    reviewCount: 425,
    price: 29,
    currency: "USD",
    priceUnit: "day",
    provider: "Lisbon E-Bikes",
    latitude: 38.7102,
    longitude: -9.1365,
    tags: ["Bike rental", "Self-guided", "Electric"],
  },
]

export function getExploreItemById(
  itemId: string,
): ExploreItem | undefined {
  return exploreItems.find((item) => item.id === itemId)
}

export function getExploreItemsByCategory(
  category: ExploreItem["category"],
): ExploreItem[] {
  return exploreItems.filter(
    (item) => item.category === category,
  )
}