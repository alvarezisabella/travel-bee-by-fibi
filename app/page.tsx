import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"
import ItineraryDemo from '@/components/landing/ItineraryDemo';
import TripSearchForm from '@/components/landing/TripSearchForm'

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

        <div className="w-full mt-8 flex justify-center" >
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
        <h3 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">Try Agent Atlas</h3>
        <p className="text-gray-500 text-lg mt-2">Chat with our AI to plan your perfect trip</p>
        </div>
        <div className="w-[520px] mx-auto mt-10 border-4 border-blue-500 rounded-2xl overflow-hidden bg-white shadow-lg">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-400">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-300">
          🤖
        </div>
        <div>
          <p className="font-semibold text-sm">Agent Atlas</p>
          <p className="text-xs text-gray-700">AI Travel Assistant</p>
        </div>
      </div>
        </div>
      </section>
    </main>
  );
}