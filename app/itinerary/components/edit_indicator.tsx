import { PencilOff } from "lucide-react";
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

async function getUserName() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  let userName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single()

    const first = profile?.first_name ?? ""
    const last = profile?.last_name ?? ""
    userName = [first, last].filter(Boolean).join(" ") || user.email || null
    return userName
  } 
}

export async function EventLock() {
  const username = await getUserName()
    return (
        <div className="mb-2 flex items-center gap-2 text-sm text-amber-600">
          <PencilOff />
            <span>${username} is editing this</span>
        </div>
    )
}