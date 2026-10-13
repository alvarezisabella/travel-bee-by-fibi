import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

interface OrderUpdate {
  id: string
  day: string
  position: number
}

export async function PUT(req: NextRequest) {
  const { itineraryid, updates } = (await req.json()) as {
    itineraryid: string
    updates: OrderUpdate[]
  }
  if (!itineraryid || !Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "itineraryid and updates are required" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from("events")
        .update({ day: u.day, position: u.position })
        .eq("id", u.id)
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}