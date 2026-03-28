import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getItinerariesByUser } from "@/lib/supabase/itinerary"

interface NavbarProps {
  tripsHref: string
}

// Extracts initials from a full name e.g. "John Doe" → "JD"
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

export default async function NavBar({ tripsHref }: NavbarProps) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile for avatar/name if logged in
  let profileName: string | null = null
  let avatarUrl: string | null = null

  if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single()

  const first = profile?.first_name ?? ""
  const last = profile?.last_name ?? ""
  profileName = [first, last].filter(Boolean).join(" ") || user.email || null
  avatarUrl = profile?.avatar_url ?? null
}

  return (
    <nav className="w-full flex items-center justify-between px-10 py-4 bg-white border-b border-gray-100 shadow-sm">

      {/* Logo - left */}
      <div className="flex-1">
        <Link href="/">
          <img src="/travelbee-logo.svg" alt="TravelBee" width={220} height={55} />
        </Link>
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

      {/* Auth - right */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {user ? (
          // Logged in — show avatar or initials
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profileName ?? "Profile"}
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#F5C842] flex items-center justify-center text-sm font-bold text-gray-900">
                {profileName ? getInitials(profileName) : "?"}
              </div>
            )}
          </Link>
        ) : (
          // Logged out — show login/signup buttons
          <>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-all"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-gray-900 bg-[#F5C842] hover:bg-[#e6b93a] px-5 py-2 rounded-full transition-all shadow-sm"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

    </nav>
  )
}