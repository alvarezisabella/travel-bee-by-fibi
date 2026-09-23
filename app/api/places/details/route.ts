import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/map/places";

export async function POST(req: NextRequest) {
  try {
    const { placeId, sessionToken } = await req.json();

    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    const result = await getPlaceDetails(placeId, sessionToken);

    if (!result) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
