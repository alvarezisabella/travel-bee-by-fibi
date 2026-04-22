"use client"

const itineraries = [
  {
    city: "New York City",
    days: 4,
    highlights: "Times Square, Central Park, Broadway shows, food tours",
    travelers: 3,
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
  },
  {
    city: "Romantic Paris",
    days: 7,
    highlights: "Eiffel Tower, Louvre, Seine cruise, local cafés",
    travelers: 2,
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
  },
  {
    city: "Tokyo Adventure",
    days: 10,
    highlights: "Shibuya, temples, street food, Mt. Fuji day trip",
    travelers: 4,
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
  },
]

export default function ItinerariesSection() {
  return (
    <section className="w-full bg-white py-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="font-raleway font-extrabold text-3xl md:text-4xl text-gray-900">
            Your Potential Itineraries
          </h2>
          <p className="text-gray-500 text-[15px] mt-3">
            See what TravelBee creates for travelers like you
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {itineraries.map((trip) => (
            <div
              key={trip.city}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-[180px] overflow-hidden rounded-t-2xl">
                <img
                  src={trip.img}
                  alt={trip.city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Days badge */}
                <div className="absolute top-3 right-3 bg-white text-gray-900 text-[12px] font-semibold px-3 py-1 rounded-full shadow-sm">
                  {trip.days} Days
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-raleway font-extrabold text-[18px] text-gray-900 mb-1.5">
                  {trip.city}
                </h3>
                <p className="text-[13px] text-gray-400 leading-relaxed mb-4">
                  {trip.highlights}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">{trip.travelers} travelers</span>
                  <button className="text-[13px] font-semibold text-[#b8860b] hover:text-[#F5C300] transition-colors">
                    View →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Browse CTA */}
        <div className="flex justify-center mt-10">
          <button className="text-[14px] font-semibold text-[#b8860b] hover:text-[#F5C300] transition-colors">
            Browse more itineraries →
          </button>
        </div>

      </div>
    </section>
  )
}