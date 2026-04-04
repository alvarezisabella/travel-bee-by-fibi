import { NextRequest, NextResponse } from "next/server";
import { geocodeCity } from "../../../lib/map/geocode";

export async function POST(req: NextRequest) {
  try {
    const { city } = await req.json();

    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    const result = await geocodeCity(city);

    if (!result) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}