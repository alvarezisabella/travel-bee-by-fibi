import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { saveSuggestion, getSuggestions, deleteSuggestion } from "@/lib/supabase/aiSuggestions"

// GET api function to load all saved suggestions for an itinerary
export async function GET(req: NextRequest) {
  // creates supabase client
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // checks if user is authenticated, if not returns 401 error
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // passes itineraryId as a query param, used to load suggestions for the correct trip
  const itineraryId = req.nextUrl.searchParams.get('itineraryId')
  if (!itineraryId) {
    return NextResponse.json({ error: "itineraryId is required." }, { status: 400 })
  }

  // queries the database for suggestions on this itinerary, returns them as json or an error if it fails
  const { data, error } = await getSuggestions(supabase, itineraryId)
  if (error) return NextResponse.json({ error: "Failed to load suggestions." }, { status: 500 })
  return NextResponse.json({ suggestions: data })
}

// POST api function to insert a new suggestion into the database, requires itineraryId and content in the request body, messageId is optional
export async function POST(req: NextRequest) {
  // creates supabase client and checks if user is authenticated, if not returns 401 error
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // itineraryId = which trip to attach the suggestion to
  // content = the text of the AI message being saved
  // messageId (optional) = the chat_messages row this was saved from
  const { itineraryId, content, messageId }: {
    itineraryId: string
    content: string
    messageId?: string
  } = await req.json()

  if (!itineraryId || !content) {
    return NextResponse.json({ error: "itineraryId and content are required." }, { status: 400 })
  }

  // saves the suggestion to the database, returns the new suggestion as json or an error if it fails
  const { data, error } = await saveSuggestion(supabase, itineraryId, user.id, content, messageId)
  if (error) return NextResponse.json({ error: "Failed to save suggestion." }, { status: 500 })
  return NextResponse.json({ suggestion: data })
}

// DELETE api function to delete a suggestion, requires the suggestion id as a query param
export async function DELETE(req: NextRequest) {
  // creates supabase client and checks if user is authenticated, if not returns 401 error
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  // gets the suggestion id from the query params
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 })
  }

  // deletes the suggestion from the database, returns success or an error if it fails
  const { error } = await deleteSuggestion(supabase, id)
  if (error) return NextResponse.json({ error: "Failed to delete suggestion." }, { status: 500 })
  return NextResponse.json({ success: true })
}
