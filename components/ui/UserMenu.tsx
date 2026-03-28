"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserMenuProps {
  profileName: string | null
  avatarUrl: string | null
  initials: string
}

export default function UserMenu({ profileName, avatarUrl, initials }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="hover:opacity-80 transition-opacity focus:outline-none"
      >
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
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          
          {/* User info */}
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 truncate">{profileName ?? "User"}</p>
          </div>

          {/* Links */}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Profile
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}