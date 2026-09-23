"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileText, ImageIcon, Upload, Trash2, Download, FolderOpen, Loader2 } from "lucide-react"

interface TripDocument {
  id: string
  name: string
  file_type: string
  size: number | null
  created_at: string
  signed_url: string | null
  uploader: { username: string; first_name: string | null; last_name: string | null } | null
}

interface Props {
  tripId: string
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DocumentsPanel({ tripId }: Props) {
  const [docs, setDocs] = useState<TripDocument[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trips/${tripId}/documents`)
      if (!res.ok) throw new Error('Failed to load documents')
      const json = await res.json()
      setDocs(json.documents)
      setIsOwner(json.is_owner)
    } catch {
      setError('Could not load documents.')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/trips/${tripId}/documents`, { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      await fetchDocs()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId)
    setError(null)
    try {
      const res = await fetch(`/api/trips/${tripId}/documents?docId=${docId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Delete failed')
      }
      setDocs(prev => prev.filter(d => d.id !== docId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-60"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <FolderOpen size={40} strokeWidth={1.5} />
          <p className="text-sm">No documents yet. Upload a confirmation or ticket.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
          {docs.map(doc => {
            const isPdf = doc.file_type === 'application/pdf'
            return (
              <li key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                <div className="text-gray-400 shrink-0">
                  {isPdf ? <FileText size={22} /> : <ImageIcon size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(doc.created_at)}
                    {doc.size ? ` · ${formatBytes(doc.size)}` : ''}
                    {doc.uploader
                      ? ` · ${doc.uploader.first_name ?? doc.uploader.username}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.signed_url && (
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-700 transition"
                      title="Download"
                    >
                      <Download size={17} />
                    </a>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-gray-400 hover:text-red-500 transition disabled:opacity-40"
                      title="Delete"
                    >
                      {deletingId === doc.id
                        ? <Loader2 size={17} className="animate-spin" />
                        : <Trash2 size={17} />}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
