import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"
import ItineraryDemo from '@/components/landing/ItineraryDemo';
import TripSearchForm from '@/components/landing/TripSearchForm'
import ItinerariesSection from '@/components/landing/GeneratedItineraries'

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
      <section className="w-full flex flex-col items-center justify-center text-center px-8 py-24 gap-6">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Plan together,
        </h1>
        <h1 className="text-5xl md:text-6xl font-bold italic text-[#F5C842] leading-tight -mt-2">
          travel smarter
        </h1>

        <p className="text-gray-500 text-lg mt-2">
          AI meets collaboration. Your perfect itinerary, crafted together.
        </p>

        <div className="w-full max-w-[1000px] mt-4">
          <TripSearchForm />
        </div>

        <div className="w-full mt-8 flex justify-center">
          <div className="w-full max-w-[1100px] aspect-[16/10]">
            <iframe
              src="/demo/ItineraryDemo.html"
              title="TravelBee demo"
              scrolling="no"
              className="w-full h-full border-0 block"
            />
          </div>
        </div>
        
        <div>
          <ItinerariesSection />
        </div>
      </section>
    </main>
  );
}