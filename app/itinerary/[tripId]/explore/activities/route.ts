import { NextRequest, NextResponse } from "next/server"
import { searchTicketmaster } from "@/lib/ticketmaster"

export async function GET(
    req: NextRequest, 
    { params }: { params: Promise<{ tripId: string }> }
) {
    const { tripId } = await params
    if (!tripId) {
        return NextResponse.json({ error: "tripId is required" }, { status: 400 })
    }
    const { searchParams } = new URL(req.url)
    const location = searchParams.get("location")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!location) {
        return NextResponse.json({ error: "location is required" }, { status: 400 })
    }

    const widgets = await searchTicketmaster("", location, 0, { startDate, endDate })
    return NextResponse.json({ widgets })
}