// app/demo/demoData.ts

export interface DemoEvent {
  id: string
  title: string
  description: string
  type: "Activity" | "Transit" | "Reservation" | "Food"
  status: "Confirmed" | "Pending" | "Idea"
  startTime: string
  duration: number
  location: string
}

export interface DemoDay {
  id: string
  date: string
  events: DemoEvent[]
}

export interface DemoItinerary {
  id: string
  title: string
  location: string
  startDate: string
  endDate: string
  travelers: number
  coverImg: string
  days: DemoDay[]
}

export const DEMO_ITINERARIES: Record<string, DemoItinerary> = {
  "demo-nyc": {
    id: "demo-nyc",
    title: "Autumn in the Big Apple",
    location: "New York City, USA",
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    travelers: 2,
    coverImg: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80",
    days: [
      {
        id: "1",
        date: "2026-10-10",
        events: [
          { id: "e1", title: "Fly into JFK", description: "Arrive at JFK and check into hotel in Midtown.", type: "Transit", status: "Confirmed", startTime: "10:00", duration: 60, location: "JFK Airport, New York" },
          { id: "e2", title: "Times Square", description: "Evening stroll through Times Square — grab a slice of NY pizza.", type: "Activity", status: "Confirmed", startTime: "18:00", duration: 90, location: "Times Square, Manhattan" },
        ],
      },
      {
        id: "2",
        date: "2026-10-11",
        events: [
          { id: "e3", title: "Central Park Morning Walk", description: "Walk the loop, visit Bethesda Fountain and Bow Bridge.", type: "Activity", status: "Confirmed", startTime: "09:00", duration: 120, location: "Central Park, New York" },
          { id: "e4", title: "The Met Museum", description: "Spend the afternoon exploring the Metropolitan Museum of Art.", type: "Activity", status: "Confirmed", startTime: "13:00", duration: 180, location: "The Met, 5th Ave" },
          { id: "e5", title: "Dinner at Carbone", description: "Reservation for 2 at the iconic Italian-American restaurant.", type: "Reservation", status: "Confirmed", startTime: "19:30", duration: 120, location: "Carbone, Greenwich Village" },
        ],
      },
      {
        id: "3",
        date: "2026-10-12",
        events: [
          { id: "e6", title: "Brooklyn Bridge Walk", description: "Walk across from Manhattan side, enjoy skyline views.", type: "Activity", status: "Confirmed", startTime: "10:00", duration: 60, location: "Brooklyn Bridge, New York" },
          { id: "e7", title: "DUMBO Brunch", description: "Brunch at a local spot in Brooklyn's DUMBO neighborhood.", type: "Food", status: "Confirmed", startTime: "12:00", duration: 75, location: "DUMBO, Brooklyn" },
          { id: "e8", title: "Broadway Show", description: "Evening show in the Theater District — tickets booked.", type: "Reservation", status: "Confirmed", startTime: "19:00", duration: 150, location: "Theater District, Manhattan" },
        ],
      },
      {
        id: "4",
        date: "2026-10-13",
        events: [
          { id: "e9", title: "High Line Walk", description: "Morning walk on the elevated park along the Hudson.", type: "Activity", status: "Confirmed", startTime: "09:30", duration: 90, location: "The High Line, Manhattan" },
          { id: "e10", title: "Fly home", description: "Head to JFK for departure.", type: "Transit", status: "Confirmed", startTime: "15:00", duration: 60, location: "JFK Airport, New York" },
        ],
      },
    ],
  },

  "demo-paris": {
    id: "demo-paris",
    title: "Romantic Paris",
    location: "Paris, France",
    startDate: "2026-11-01",
    endDate: "2026-11-07",
    travelers: 2,
    coverImg: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    days: [
      {
        id: "1",
        date: "2026-11-01",
        events: [
          { id: "p1", title: "Arrive at CDG", description: "Land at Charles de Gaulle and check into hotel near Le Marais.", type: "Transit", status: "Confirmed", startTime: "11:00", duration: 90, location: "CDG Airport, Paris" },
          { id: "p2", title: "Seine Evening Stroll", description: "Walk along the Seine at dusk — perfect views of Notre-Dame.", type: "Activity", status: "Confirmed", startTime: "18:30", duration: 60, location: "Quai de la Tournelle, Paris" },
        ],
      },
      {
        id: "2",
        date: "2026-11-02",
        events: [
          { id: "p3", title: "Eiffel Tower", description: "Morning visit — book tickets in advance to skip the queue.", type: "Activity", status: "Confirmed", startTime: "09:00", duration: 120, location: "Champ de Mars, Paris" },
          { id: "p4", title: "Café de Flore", description: "Lunch at the legendary Saint-Germain café.", type: "Food", status: "Confirmed", startTime: "12:30", duration: 75, location: "Café de Flore, Saint-Germain" },
          { id: "p5", title: "Louvre Museum", description: "Afternoon at the Louvre — see the Mona Lisa and Venus de Milo.", type: "Activity", status: "Confirmed", startTime: "15:00", duration: 180, location: "Musée du Louvre, Paris" },
        ],
      },
      {
        id: "3",
        date: "2026-11-03",
        events: [
          { id: "p6", title: "Montmartre & Sacré-Cœur", description: "Morning in Montmartre, visit the basilica and artists' square.", type: "Activity", status: "Confirmed", startTime: "10:00", duration: 150, location: "Montmartre, Paris" },
          { id: "p7", title: "Wine & Cheese Evening", description: "Private wine tasting experience in a local cave.", type: "Reservation", status: "Confirmed", startTime: "19:00", duration: 120, location: "Le Marais, Paris" },
        ],
      },
      {
        id: "4",
        date: "2026-11-04",
        events: [
          { id: "p8", title: "Palace of Versailles", description: "Day trip to the Palace of Versailles and its gardens.", type: "Activity", status: "Confirmed", startTime: "09:00", duration: 300, location: "Versailles, France" },
        ],
      },
      {
        id: "5",
        date: "2026-11-05",
        events: [
          { id: "p9", title: "Marché des Enfants Rouges", description: "Breakfast at Paris's oldest covered market.", type: "Food", status: "Confirmed", startTime: "09:30", duration: 60, location: "Le Marais, Paris" },
          { id: "p10", title: "Centre Pompidou", description: "Modern and contemporary art museum.", type: "Activity", status: "Confirmed", startTime: "11:30", duration: 120, location: "Centre Pompidou, Paris" },
        ],
      },
      {
        id: "6",
        date: "2026-11-06",
        events: [
          { id: "p11", title: "Sainte-Chapelle", description: "Visit the stunning Gothic chapel with its stained glass.", type: "Activity", status: "Confirmed", startTime: "10:00", duration: 90, location: "Île de la Cité, Paris" },
          { id: "p12", title: "Farewell Dinner", description: "Final dinner at a classic French brasserie.", type: "Food", status: "Confirmed", startTime: "19:30", duration: 120, location: "Saint-Germain, Paris" },
        ],
      },
      {
        id: "7",
        date: "2026-11-07",
        events: [
          { id: "p13", title: "Fly home from CDG", description: "Transfer to Charles de Gaulle for departure.", type: "Transit", status: "Confirmed", startTime: "10:00", duration: 90, location: "CDG Airport, Paris" },
        ],
      },
    ],
  },

  "demo-tokyo": {
    id: "demo-tokyo",
    title: "Tokyo Adventure",
    location: "Tokyo, Japan",
    startDate: "2026-12-05",
    endDate: "2026-12-14",
    travelers: 2,
    coverImg: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
    days: [
      {
        id: "1",
        date: "2026-12-05",
        events: [
          { id: "t1", title: "Land at Narita", description: "Arrive at Narita, take the Narita Express to Shinjuku.", type: "Transit", status: "Confirmed", startTime: "14:00", duration: 90, location: "Narita Airport, Tokyo" },
          { id: "t2", title: "Shinjuku Night Exploration", description: "Explore Kabukicho and Golden Gai for dinner and drinks.", type: "Food", status: "Confirmed", startTime: "19:00", duration: 120, location: "Shinjuku, Tokyo" },
        ],
      },
      {
        id: "2",
        date: "2026-12-06",
        events: [
          { id: "t3", title: "Senso-ji Temple", description: "Early morning visit to Asakusa before the crowds arrive.", type: "Activity", status: "Confirmed", startTime: "08:00", duration: 90, location: "Senso-ji, Asakusa" },
          { id: "t4", title: "Shibuya Crossing", description: "Experience the world's busiest pedestrian crossing.", type: "Activity", status: "Confirmed", startTime: "12:00", duration: 60, location: "Shibuya, Tokyo" },
          { id: "t5", title: "Ramen Dinner", description: "Ichiran ramen — solo booths, incredible tonkotsu broth.", type: "Food", status: "Confirmed", startTime: "19:00", duration: 60, location: "Ichiran Shibuya, Tokyo" },
        ],
      },
      {
        id: "3",
        date: "2026-12-07",
        events: [
          { id: "t6", title: "Mt. Fuji Day Trip", description: "Early bus to Fuji Five Lakes — views of Mt. Fuji from Lake Kawaguchiko.", type: "Activity", status: "Confirmed", startTime: "07:00", duration: 480, location: "Lake Kawaguchiko, Yamanashi" },
        ],
      },
      {
        id: "4",
        date: "2026-12-08",
        events: [
          { id: "t7", title: "Harajuku & Takeshita Street", description: "Explore the quirky fashion district and grab crepes.", type: "Activity", status: "Confirmed", startTime: "11:00", duration: 120, location: "Harajuku, Tokyo" },
          { id: "t8", title: "Meiji Shrine", description: "Peaceful forested shrine in the heart of the city.", type: "Activity", status: "Confirmed", startTime: "14:00", duration: 90, location: "Meiji Shrine, Tokyo" },
        ],
      },
      {
        id: "5",
        date: "2026-12-09",
        events: [
          { id: "t9", title: "Tsukiji Outer Market Breakfast", description: "Fresh sushi and street food at the famous market.", type: "Food", status: "Confirmed", startTime: "08:00", duration: 90, location: "Tsukiji, Tokyo" },
          { id: "t10", title: "teamLab Planets", description: "Immersive digital art museum in Toyosu.", type: "Activity", status: "Confirmed", startTime: "14:00", duration: 180, location: "Toyosu, Tokyo" },
        ],
      },
      {
        id: "6",
        date: "2026-12-10",
        events: [
          { id: "t11", title: "Akihabara Electronics District", description: "Explore Tokyo's famous tech and anime hub.", type: "Activity", status: "Confirmed", startTime: "12:00", duration: 180, location: "Akihabara, Tokyo" },
        ],
      },
      {
        id: "7",
        date: "2026-12-11",
        events: [
          { id: "t12", title: "Nikko Day Trip", description: "UNESCO World Heritage shrines and temples north of Tokyo.", type: "Activity", status: "Confirmed", startTime: "08:00", duration: 480, location: "Nikko, Tochigi" },
        ],
      },
      {
        id: "8",
        date: "2026-12-12",
        events: [
          { id: "t13", title: "Shinjuku Gyoen Garden", description: "Beautiful national garden — great in winter.", type: "Activity", status: "Confirmed", startTime: "10:00", duration: 120, location: "Shinjuku Gyoen, Tokyo" },
          { id: "t14", title: "Omakase Dinner", description: "Special farewell omakase sushi dinner reservation.", type: "Reservation", status: "Confirmed", startTime: "19:00", duration: 120, location: "Ginza, Tokyo" },
        ],
      },
      {
        id: "9",
        date: "2026-12-13",
        events: [
          { id: "t15", title: "Last minute shopping — Shibuya", description: "Pick up souvenirs and gifts before heading home.", type: "Activity", status: "Confirmed", startTime: "10:00", duration: 180, location: "Shibuya, Tokyo" },
        ],
      },
      {
        id: "10",
        date: "2026-12-14",
        events: [
          { id: "t16", title: "Fly home from Narita", description: "Transfer to Narita for departure.", type: "Transit", status: "Confirmed", startTime: "09:00", duration: 90, location: "Narita Airport, Tokyo" },
        ],
      },
    ],
  },
}