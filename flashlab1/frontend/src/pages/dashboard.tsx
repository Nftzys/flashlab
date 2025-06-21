// pages/dashboard.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { supabase } from '../lib/supabaseClient'
import { Moon, Sun } from 'lucide-react'
import Image from 'next/image'

interface Album {
  id: string
  title: string
  created_at: string
  password?: string
  slug?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth')
      } else {
        fetchAlbums(session.user.id)
      }
    }
    checkSession()
  }, [router])

  const fetchAlbums = async (userId: string) => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching albums:', error.message)
    } else {
      setAlbums(data as Album[])
    }
  }

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .slice(0, 50)

  const createAlbum = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const slug = slugify(newTitle)

    const { data, error } = await supabase
      .from('albums')
      .insert([{ user_id: user.id, title: newTitle, password: newPassword || null, slug }])
      .select()
      .single()

    if (error) {
      console.error('Error creating album:', error.message)
    } else if (data?.slug) {
      setNewTitle('')
      setNewPassword('')
      router.push(`/dashboard/album/${data.slug}`)
    }

    setLoading(false)
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <main className="min-h-screen font-sans flex flex-col items-center px-4 bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="w-full max-w-5xl">
        <header className="flex items-center justify-between px-6 py-4 shadow-sm bg-white dark:bg-gray-900 rounded-b-xl border-b border-gray-100 dark:border-gray-800">
          <div className="relative w-8 h-8">
            <Image src="/flashbacklogo.png" alt="Flashback Logo" fill className="object-contain" />
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

        <section className="pt-16 pb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">Create a New Album</h2>
          <div className="max-w-md mx-auto space-y-5">
            <input
              type="text"
              placeholder="Album Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="text"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={createAlbum}
              disabled={loading || !newTitle.trim()}
              className="w-full py-3 font-medium rounded-md bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Album'}
            </button>
          </div>
        </section>

        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-6 text-center">Your Albums</h3>
          {albums.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No albums yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => router.push(`/dashboard/album/${album.slug}`)}
                  className="album-card"
                >
                  <h4 className="text-lg font-semibold mb-1">{album.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Created on: {formatDate(album.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="text-center text-xs text-gray-500 py-6 dark:text-gray-400">
        © 2024 Flashback. All rights reserved.
      </footer>
    </main>
  )
}
