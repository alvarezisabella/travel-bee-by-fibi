import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  let tripsHref = "/itinerary"
  console.log("[LandingPage] user:", user?.id ?? "null")
  if (user) {
    const { data, error } = await getItinerariesByUser(supabase, user.id)
    console.log("[LandingPage] itineraries:", data, "error:", error)
    if (data && data.length > 0) tripsHref = `/itinerary/${data[0].id}`
  }
  console.log("[LandingPage] tripsHref:", tripsHref)
  return (
    <main className="min-h-screen bg-[#F5F5F5]">

      {/* NAVBAR */}
      <nav className="w-full flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <div className="w-24 h-6 bg-gray-200 rounded" />
        <div className="flex gap-6">
          <div className="w-16 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-4 bg-gray-200 rounded">  
            <Link
              href={tripsHref}
              className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors rounded"
            >
              Trips
            </Link>
          </div>
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="w-20 h-8 bg-gray-200 rounded flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
            >
            Login
          </Link>
          <Link
            href="/signup"
            className="w-20 h-8 bg-[#F5C842] rounded flex items-center justify-center text-sm font-medium text-gray-900 hover:brightness-95 transition-all"
            >
            Sign Up
          </Link>
        </div>
      </nav>

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