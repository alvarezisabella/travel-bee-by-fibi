import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

interface NavbarProps {
  tripsHref: string
}

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

  const initials = profileName ? getInitials(profileName) : "?"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4 bg-gradient-to-r from-white via-white/40 to-white border-b border-white">

      {/* Logo - left */}
      <div className="flex-1">
        <Link href="/">
          <img src="/travelbee-logo.svg" alt="TravelBee" width={220} height={55} />
        </Link>
      </div>

      {/* Auth + Trips*/}
      <div className="flex-1 flex items-center justify-end gap-3">
        {user && (
          <Link href={tripsHref} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-4 py-2">
            Trips
          </Link>
        )}
        {user ? (
          <Link href="/profile" className="hover:opacity-80 transition-opacity">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profileName ?? "Profile"}
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#F5C842] flex items-center justify-center text-sm font-bold text-gray-900">
                {initials}
              </div>
            )}
          </Link>
        ) : (
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