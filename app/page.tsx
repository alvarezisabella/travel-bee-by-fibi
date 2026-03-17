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
      <nav className="w-full flex items-center justify-between px-10 py-4 bg-white border-b border-gray-100 shadow-sm">

  {/* Logo - left */}
  <div className="flex-1">
    <img src="/travelbee-logo.svg" alt="TravelBee" width={220} height={55} />
  </div>

  {/* Nav Links - center */}
  <div className="flex-1 flex items-center justify-center gap-8">
    <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
      Home
    </Link>
    <Link href={tripsHref} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
      Trips
    </Link>
    <Link href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
      Explore
    </Link>
  </div>

  {/* Auth Buttons - right */}
  <div className="flex-1 flex items-center justify-end gap-3">
    <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-all">
      Login
    </Link>
    <Link href="/signup" className="text-sm font-semibold text-gray-900 bg-[#F5C842] hover:bg-[#e6b93a] px-5 py-2 rounded-full transition-all shadow-sm">
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