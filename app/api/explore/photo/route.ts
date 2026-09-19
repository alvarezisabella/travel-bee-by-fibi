import { NextRequest, NextResponse } from "next/server"

// SerpAPI hotel images are plain googleusercontent URLs. Loading them straight
// from the page leaves some cards blank, so they are fetched server side the
// same way Places photos are.

// The url is client supplied, so only Google's image hosts are allowed
const ALLOWED_HOST = /^lh[0-9]+\.googleusercontent\.com$/

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url")

  if (!raw) {
    return NextResponse.json(
      { error: "A url is required." },
      { status: 400 }
    )
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return NextResponse.json(
      { error: "That url is not valid." },
      { status: 400 }
    )
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOST.test(parsed.host)) {
    return NextResponse.json(
      { error: "That host is not allowed." },
      { status: 400 }
    )
  }

  const res = await fetch(parsed.toString())

  if (!res.ok) {
    console.error("EXPLORE PHOTO ERROR:", res.status, parsed.host)
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
