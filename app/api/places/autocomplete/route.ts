import { NextRequest, NextResponse } from "next/server";
import { autocompletePlaces } from "@/lib/map/places";

export async function POST(req: NextRequest) {
  try {
    const { input, sessionToken, includedPrimaryTypes } = await req.json();

    if (!input || !input.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await autocompletePlaces(input.trim(), sessionToken, includedPrimaryTypes);
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
