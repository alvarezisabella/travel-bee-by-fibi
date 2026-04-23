"use client"
import { useRouter } from "next/navigation"
import { DEMO_ITINERARIES } from "@/app/demo/demoData"

const itineraries = [
  {
    ...DEMO_ITINERARIES["demo-nyc"],
    highlights: "Times Square, Central Park, Broadway shows, food tours",
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
  },
  {
    ...DEMO_ITINERARIES["demo-paris"],
    highlights: "Eiffel Tower, Louvre, Seine cruise, local cafés",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
  },
  {
    ...DEMO_ITINERARIES["demo-tokyo"],
    highlights: "Shibuya, temples, street food, Mt. Fuji day trip",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
  },
]

export default function GeneratedItineraries() {
  const router = useRouter()

  return (
    <section className="w-full bg-[#F5F5F5] py-24 px-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="font-raleway font-extrabold text-3xl md:text-4xl text-gray-900">
            Your Potential Itineraries
          </h2>
          <p className="text-gray-500 text-[15px] mt-3">
            See what TravelBee creates for travelers like you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {itineraries.map((trip) => (
            <div
              key={trip.id}
              className="group cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-2"
            >
              <div className="relative h-[200px] overflow-hidden rounded-2xl">
                <img
                  src={trip.img}
                  alt={trip.city}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
                <div className="absolute top-3 right-3 bg-white text-gray-900 text-[12px] font-semibold px-3 py-1 rounded-full shadow-sm">
                  {trip.days.length} Days
                </div>
              </div>
              <div className="pt-4 px-1">
                <h3 className="font-raleway font-extrabold text-[18px] text-gray-900 mb-1">
                  {trip.title}
                </h3>
                <p className="text-[13px] text-gray-400 leading-relaxed mb-4">
                  {trip.highlights}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">
                    {trip.travelers} {trip.travelers === 1 ? "traveler" : "travelers"}
                  </span>
                  <button
                    onClick={() => router.push(`/demo/${trip.id}`)}
                    className="text-[13px] font-semibold text-[#b8860b] hover:text-[#F5C300] transition-colors"
                  >
                    View →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <button className="text-[14px] font-semibold text-[#b8860b] hover:text-[#F5C300] transition-colors">
            Browse more itineraries →
          </button>
        </div>

      </div>
    </section>
  )
}