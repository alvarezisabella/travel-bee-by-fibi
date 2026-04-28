import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"
import TripSearchForm from '@/components/landing/TripSearchForm'
import ItinerariesSection from '@/components/landing/GeneratedItineraries'
import FeaturesCarousel from '@/components/landing/FeaturesCarousel'
import CTASection from '@/components/landing/CTASection'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data, error } = await getItinerariesByUser(supabase, user.id)
    console.log("[LandingPage] itineraries:", data, "error:", error)
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5]">

      {/* Hero + search form */}
      <section className="w-full flex flex-col items-center text-center px-8 pt-20 pb-12 gap-4">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Plan together,
        </h1>
        <div style={{ filter: "drop-shadow(0 0 12px rgba(245,195,0,0.45))" }}>
          <h1
            className="text-5xl md:text-6xl font-bold italic leading-tight -mt-2"
            style={{
              background: "linear-gradient(to right, #F5C300, #FF8C00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            travel smarter
          </h1>
        </div>
        <p className="text-gray-500 text-lg mt-1">
          AI meets collaboration. Your perfect itinerary, crafted together.
        </p>
        <div className="w-full max-w-[1000px] mt-2">
          <TripSearchForm />
        </div>
      </section>

      {/* Demo iframe */}
      <section className="w-full flex justify-center px-8 pb-4">
        <div className="w-full max-w-[1100px] aspect-[16/10]">
          <iframe
            src="/demo/ItineraryDemo.html"
            title="TravelBee demo"
            scrolling="no"
            className="w-full h-full border-0 block"
          />
        </div>
      </section>

      {/* Features carousel */}
      <FeaturesCarousel />

      {/* Potential itineraries */}
      <ItinerariesSection />

      {/* CTA */}
      <CTASection />

    </main>
  )
}