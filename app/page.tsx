import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"

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

      {/* HERO SECTION */}
      <section className="w-full flex flex-col items-center justify-center text-center px-8 py-24 gap-6">
        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Plan together,
        </h1>
        <h1 className="text-5xl md:text-6xl font-bold italic text-[#F5C842] leading-tight -mt-2">
          travel smarter
        </h1>

        {/* Subtext */}
        <p className="text-gray-500 text-lg mt-2">
          AI meets collaboration. Your perfect itinerary, crafted together.
        </p>

        {/* CTAs */}
        <div className="flex gap-4 mt-4">
          <div className="w-32 h-10 bg-[#F5C842] rounded" />
          <div className="w-32 h-10 bg-gray-200 rounded" />
        </div>

        {/* Hero image */}
        <div className="w-full max-w-3xl h-72 bg-gray-300 rounded-2xl mt-8" />
      </section>

    </main>
  );
}