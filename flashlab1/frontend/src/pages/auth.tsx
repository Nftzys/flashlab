import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import Image from 'next/image'

export default function AuthPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) setTheme('light')
  }, [mounted, setTheme])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) router.push('/dashboard')
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.push('/dashboard')
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) console.error('Google sign-in error:', error.message)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-between bg-white dark:bg-black text-gray-900 dark:text-white transition-colors px-4 py-8">

      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between h-16 px-4 mb-10">
        <div className="relative h-10 w-32">
          <Image
            src="/flashbacklogo.png"
            alt="Flashback Logo"
            layout="fill"
            objectFit="contain"
            priority
          />
        </div>

        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </header>

      {/* Auth Box */}
      <div className="w-full max-w-sm px-6 py-8 rounded-2xl shadow-md bg-white dark:bg-neutral-900 text-center space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your private event albums, reimagined.
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-black text-white dark:bg-white dark:text-black py-2.5 px-4 rounded-xl text-sm font-medium hover:opacity-90 transition shadow"
          aria-label="Sign in with Google"
        >
          <FcGoogle className="w-5 h-5" />
          Continue with Google
        </button>
      </div>

      {/* Footer */}
      <footer className="text-xs text-gray-400 dark:text-gray-600 mt-10">
        © 2024 Flashback. Minimalism meets memory.
      </footer>
    </main>
  )
}
