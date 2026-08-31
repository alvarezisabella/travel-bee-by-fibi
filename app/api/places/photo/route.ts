import { NextRequest, NextResponse } from "next/server"

// Places photos come back as resource ids rather than URLs, and fetching one
// needs the API key. Proxying here keeps the key off the page.

// The name is client supplied, so it is checked against the exact resource
// shape before being put in a URL
const PHOTO_NAME = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")

  if (!name || !PHOTO_NAME.test(name)) {
    return NextResponse.json(
      { error: "A valid photo name is required." },
      { status: 400 }
    )
  }

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY is not configured." },
      { status: 500 }
    )
  }

  const url =
    `https://places.googleapis.com/v1/${name}/media` +
    `?maxHeightPx=600&key=${key}`

  const res = await fetch(url)

  if (!res.ok) {
    console.error("PLACES PHOTO ERROR:", res.status, name)
    return NextResponse.json(
      { error: "Photo could not be loaded." },
      { status: res.status }
    )
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  })
}
