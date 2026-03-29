import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export default async function ProfileHeader() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url, created_at")
    .eq("id", user?.id ?? "")
    .single()

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unknown"
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown"

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center gap-6">
      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs text-center leading-tight px-1">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
        ) : (
          "Profile Photo"
        )}
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-xl font-bold text-gray-800">{fullName}</p>
        <p className="text-sm text-gray-400">{user?.email}</p>
        <p className="text-xs text-gray-300">Member since {memberSince}</p>
      </div>
      <button className="w-28 h-9 bg-yellow-400 rounded-full text-sm font-medium text-gray-900">
        Edit Profile
      </button>
    </div>
  )
}