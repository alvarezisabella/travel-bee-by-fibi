"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Camera, X } from "lucide-react"

interface Props {
  userId: string
  currentFirstName: string | null
  currentLastName: string | null
  currentAvatarUrl: string | null
}

export default function ProfileForm({ userId, currentFirstName, currentLastName, currentAvatarUrl }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = [currentFirstName?.[0], currentLastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?"

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ""
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const filePath = `${userId}/avatar`

      const { error: uploadErr } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath)

      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
    } catch (err) {
      setError("Failed to upload photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const cleanUrl = avatarUrl?.split("?")[0] ?? null

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: cleanUrl })
        .eq("id", userId)

      if (dbErr) throw dbErr

      setOpen(false)
      router.refresh()

    } catch (err) {
      setError("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-28 h-9 bg-yellow-400 hover:bg-yellow-500 rounded-full text-sm font-medium text-gray-900 transition-all"
      >
        Edit Profile
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-8 flex flex-col gap-5 mx-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Profile Photo</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-yellow-100 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin text-yellow-500" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <span className="text-3xl font-bold text-yellow-600">{initials}</span>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera size={20} className="text-white" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <p className="text-xs text-gray-400">
                {uploading ? "Uploading..." : "Click photo to change"}
              </p>
            </div>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-900 bg-[#F5C842] hover:bg-[#e6b93a] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}