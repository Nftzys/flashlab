// src/pages/view/[id].tsx
import { useRouter } from 'next/router'
import { useState, useEffect, ChangeEvent, MouseEvent } from 'react'
import { ScanFace, Download, X } from 'lucide-react'
import Image from 'next/image'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ViewAlbumPage() {
  const router = useRouter()
  const { id } = router.query
  const [matches, setMatches] = useState<string[]>([])
  const [allPhotos, setAllPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [albumTitle, setAlbumTitle] = useState('')
  const [showingMatchesOnly, setShowingMatchesOnly] = useState(false)
  const [popupImage, setPopupImage] = useState<string | null>(null)
  const [popupFilename, setPopupFilename] = useState<string>('')

  useEffect(() => {
    if (!id) return
    setAlbumTitle(id as string)

    fetch(`${API_BASE}/photos/${id}`)
      .then(res => res.json())
      .then(data => setAllPhotos(data.photos || []))
      .catch(err => console.error('Error loading photos:', err))
  }, [id])

  const handleSelfieUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files?.[0]) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', e.target.files[0])
    formData.append('album_id', id as string)

    try {
      const res = await fetch(`${API_BASE}/compare/?album_id=${id}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Face match failed.')
      }

      const data = await res.json()
      setMatches(data.matches || [])
      setShowingMatchesOnly(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Face matching failed.'
      console.error('❌ Compare failed:', message)
      alert(message)
    } finally {
      setUploading(false)
    }
  }

  const handleShowFullAlbum = () => setShowingMatchesOnly(false)

  const handleImageClick = (src: string, filename: string) => {
    setPopupImage(src)
    setPopupFilename(filename)
  }

  const closePopup = () => {
    setPopupImage(null)
    setPopupFilename('')
  }

  const handleDownload = async (e: MouseEvent, filename: string) => {
    e.stopPropagation()
    if (!id) return

    try {
      const response = await fetch(`${API_BASE}/download/${id}/${filename}`)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to download image.')
    }
  }

  const renderImageCard = (src: string, filename: string, index: number) => (
    <div
      key={index}
      className="relative group rounded-md overflow-hidden cursor-pointer"
      onClick={() => handleImageClick(src, filename)}
    >
      <div className="relative w-full aspect-square">
        <Image
          src={src}
          alt={`Photo ${index}`}
          fill
          className="object-cover"
        />
      </div>
      <button
        onClick={(e) => handleDownload(e, filename)}
        className="absolute bottom-2 right-2 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
        title="Download"
      >
        <Download size={16} />
      </button>
    </div>
  )

  return (
    <main className="min-h-screen font-sans flex flex-col items-center px-4 py-6 bg-white text-gray-900 dark:bg-gray-950 dark:text-white relative">
      <div className="w-full max-w-5xl">
        <header className="flex items-center justify-between px-6 py-4 shadow-sm bg-white dark:bg-gray-900 rounded-b-xl border-b border-gray-100 dark:border-gray-800 mb-8">
          <div className="relative w-8 h-8">
            <Image src="/flashbacklogo.png" alt="Flashback Logo" fill className="object-contain" />
          </div>
          <h1 className="text-xl font-bold text-center capitalize">{albumTitle}</h1>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">
            <ScanFace size={16} /> Find Yourself
            <input
              type="file"
              accept="image/*"
              onChange={handleSelfieUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </header>

        <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md w-full mb-8">
          {uploading && (
            <p className="text-center text-sm text-indigo-500 mb-4">Processing your selfie...</p>
          )}

          {showingMatchesOnly && matches.length > 0 ? (
            <div className="w-full flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-4 text-center">Matched Photos</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 w-full">
                {matches.map((path, i) => {
                  const filename = path.split('/').pop() || `match-${i}.jpg`
                  const src = `${API_BASE}/photos/${path}`
                  return renderImageCard(src, filename, i)
                })}
              </div>
              <button
                onClick={handleShowFullAlbum}
                className="mt-6 text-sm px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              >
                Show Full Album
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 w-full">
                {allPhotos.map((filename, i) => {
                  const src = `${API_BASE}/photos/${id}/${filename}`
                  return renderImageCard(src, filename, i)
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="w-full text-center text-xs text-gray-500 py-6 border-t mt-12 dark:text-gray-400">
        © 2024 Flash Back. All rights reserved.
      </footer>

      {popupImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={closePopup}
        >
          <div
            className="relative bg-transparent rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-h-[80vh] aspect-video">
              <Image
                src={popupImage}
                alt="Full View"
                fill
                className="object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-4 mt-4 w-full px-4">
              <button
                onClick={(e) => handleDownload(e, popupFilename)}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"
                title="Download"
              >
                <Download size={20} />
              </button>
              <button
                onClick={closePopup}
                className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
