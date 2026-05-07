import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getMemberAndOwner(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string, userId: string) {
  const [{ data: member }, { data: trip }] = await Promise.all([
    supabase.from('itinerary_members').select('id').eq('itinerary_id', tripId).eq('user_id', userId).single(),
    supabase.from('itineraries').select('created_by').eq('id', tripId).single(),
  ])
  return { isMember: !!member, isOwner: trip?.created_by === userId }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { isMember, isOwner } = await getMemberAndOwner(supabase, tripId, user.id)
  if (!isMember) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { data, error } = await supabase
    .from('trip_documents')
    .select('*, uploader:profiles!uploaded_by(username, first_name, last_name)')
    .eq('itinerary_id', tripId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const documents = await Promise.all(
    (data ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from('trip-documents')
        .createSignedUrl(doc.file_url, 3600)
      return { ...doc, signed_url: signed?.signedUrl ?? null }
    })
  )

  return NextResponse.json({ documents, is_owner: isOwner })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { isMember } = await getMemberAndOwner(supabase, tripId, user.id)
  if (!isMember) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF and image files are allowed.' }, { status: 400 })
  }
  if (file.size > 52428800) {
    return NextResponse.json({ error: 'File size must be under 50MB.' }, { status: 400 })
  }

  const docId = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${tripId}/${docId}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('trip-documents')
    .upload(storagePath, arrayBuffer, { contentType: file.type })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await supabase
    .from('trip_documents')
    .insert({ itinerary_id: tripId, name: file.name, file_url: storagePath, file_type: file.type, size: file.size, uploaded_by: user.id })
    .select()
    .single()
  if (error) {
    await supabase.storage.from('trip-documents').remove([storagePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ document: data }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const docId = req.nextUrl.searchParams.get('docId')
  if (!docId) return NextResponse.json({ error: 'docId required.' }, { status: 400 })

  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { isOwner } = await getMemberAndOwner(supabase, tripId, user.id)
  if (!isOwner) return NextResponse.json({ error: 'Only the trip owner can delete documents.' }, { status: 403 })

  const { data: doc } = await supabase
    .from('trip_documents')
    .select('file_url')
    .eq('id', docId)
    .eq('itinerary_id', tripId)
    .single()
  if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })

  const { error } = await supabase.from('trip_documents').delete().eq('id', docId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.storage.from('trip-documents').remove([doc.file_url])

  return NextResponse.json({ success: true })
}
