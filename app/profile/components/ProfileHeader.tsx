import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import ProfileForm from "./ProfileForm"

export default async function ProfileHeader() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url, created_at, username")
    .eq("id", user?.id ?? "")
    .single()

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Unknown"

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown"

  const initials =
    [profile?.first_name?.[0], profile?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?"

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-yellow-100 sm:h-28 sm:w-28">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                className="h-full w-full object-cover"
                alt={fullName}
              />
            ) : (
              <span className="text-2xl font-bold text-yellow-600">
                {initials}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="truncate text-2xl font-bold text-gray-800">
              {fullName}
            </p>

            <p className="truncate text-base text-gray-400">
              {profile?.username ? `@${profile.username}` : user?.email}
            </p>

            <p className="text-sm text-gray-300">
              Member since {memberSince}
            </p>
          </div>
        </div>

        <div className="flex justify-center sm:justify-end">
          <ProfileForm
            userId={user?.id ?? ""}
            currentFirstName={profile?.first_name ?? null}
            currentLastName={profile?.last_name ?? null}
            currentAvatarUrl={profile?.avatar_url ?? null}
          />
        </div>
      </div>
    </div>
  )
}