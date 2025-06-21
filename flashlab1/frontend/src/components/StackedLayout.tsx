'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import Image from 'next/image'

export default function StackedLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f9f9] dark:bg-[#1a1a1a] transition-colors">
      <header className="bg-white dark:bg-[#2a2a2a] shadow rounded-b-lg px-6 py-4 flex justify-between items-center">
        <div className="relative w-8 h-8">
          <Image
            src="/flashbacklogo.png"
            alt="Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <nav className="flex items-center space-x-6 text-sm">
          {['Home', 'Albums', 'About', 'Pricing'].map((x) => (
            <a key={x} href="#" className="hover:underline">
              {x}
            </a>
          ))}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="ml-6 p-2 border rounded border-gray-300 dark:border-gray-600"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </nav>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-6 border-t">
        © 2024 Flash Back. All rights reserved.
      </footer>
    </div>
  )
}
