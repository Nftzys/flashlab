// AlbumPage.tsx
import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export default function AlbumPage() {
  const router = useRouter()
  const { id: slug } = router.query
  const [albumTitle, setAlbumTitle] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [publicLink, setPublicLink] = useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const fetchAlbum = useCallback(async () => {
    try {
      const response = await fetch(`/api/get-album?id=${slug}`)
      if (!response.ok) throw new Error('Failed to fetch album')
      const data = await response.json()
      setAlbumTitle(data.title || (slug as string))
    } catch (error: unknown) {
      const err = error as Error
      console.error('Error fetching album title:', err.message)
      setAlbumTitle(slug as string)
    }
  }, [slug])

  const fetchPhotos = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/photos/${slug}`)
      if (!response.ok) throw new Error('Failed to fetch photos')
      const data = await response.json()
      setPhotos(data.photos || [])
    } catch (error: unknown) {
      const err = error as Error
      console.error('Error fetching photos:', err.message)
    }
  }, [slug])

  useEffect(() => {
    if (slug) {
      fetchAlbum()
      fetchPhotos()
      if (typeof window !== 'undefined') {
        setPublicLink(`${window.location.origin}/view/${slug}`)
      }
    }
  }, [slug, fetchAlbum, fetchPhotos])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !slug) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('album_id', slug as string)

      const uploadRes = await fetch(`http://localhost:8000/add_to_db/?album_id=${slug}`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        try {
          const result = await uploadRes.json()
          console.error('Upload error:', result.detail)
        } catch {
          console.error('Upload failed')
        }
      }
    }

    setUploading(false)
    fetchPhotos()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink)
      .then(() => alert('Link copied to clipboard!'))
      .catch((err) => console.error('Copy failed', err))
  }

  return (
    <main className="min-h-screen font-sans flex flex-col items-center px-4 py-6 bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="w-full max-w-5xl">
        <header className="flex items-center justify-between px-6 py-4 shadow-sm bg-white dark:bg-gray-900 rounded-b-xl border-b border-gray-100 dark:border-gray-800 mb-8">
          <div className="flex items-center gap-3">
            <Image src="/flashbacklogo.png" alt="Flashback Logo" width={32} height={32} />
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <a href="#" className="hover:underline">Home</a>
            <a href="#" className="hover:underline">Albums</a>
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Pricing</a>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
          </nav>
        </header>

        <section className="flex flex-col items-center justify-start gap-8">
          <h1 className="text-2xl font-bold text-center">{albumTitle}</h1>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md w-full max-w-xl">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-inner mb-4">
              <input
                type="file"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                title="Upload Files"
              />
              {uploading && <p className="text-sm text-indigo-500 mt-2">Uploading...</p>}
            </div>
            {photos.length > 0 && (
              <button
                onClick={copyToClipboard}
                className="w-full text-center py-2 px-4 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                {publicLink}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 w-full">
            {photos.map((filename, i) => (
              <div key={i} className="rounded-md overflow-hidden">
                <Image
                  src={`http://localhost:8000/photos/${slug}/${filename}`}
                  alt={`Photo ${i}`}
                  width={300}
                  height={300}
                  className="w-full aspect-square object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="w-full text-center text-xs text-gray-500 py-6 border-t mt-12 dark:text-gray-400">
        © 2024 Flash Back. All rights reserved.
      </footer>
    </main>
  )
}
