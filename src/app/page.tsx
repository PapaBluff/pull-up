'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { id: 'home-help', label: 'Home Help' },
  { id: 'social', label: 'Social' },
  { id: 'creators', label: 'Creators' },
  { id: 'learning', label: 'Learning' },
  { id: 'experiences', label: 'Experiences' },
]

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [urgency, setUrgency] = useState<'NOW' | 'SCHEDULE'>('NOW')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  function handleFindSomeone(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    params.set('when', urgency.toLowerCase())
    if (selectedCategory) params.set('category', selectedCategory)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Top Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          PULL UP
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/telemetry"
              className="text-xs font-semibold tracking-wider uppercase text-neutral-300 hover:text-white transition"
            >
              DASHBOARD
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold tracking-wider uppercase text-neutral-400 hover:text-white transition"
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold tracking-wider uppercase text-neutral-300 hover:text-white transition"
            >
              LOG IN
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
            >
              JOIN
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-xl px-6 pb-20 flex flex-col">
        {/* Hero Dispatch Prompt */}
        <section className="pt-8 pb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase mb-6">
            WHO DO YOU NEED?
          </h1>

          <form onSubmit={handleFindSomeone} className="space-y-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tell us what you're looking for..."
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />

            <button
              type="submit"
              className="w-full sm:w-auto sm:min-w-[220px] rounded-xl bg-white px-6 py-3.5 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
            >
              FIND SOMEONE
            </button>
          </form>
        </section>

        <hr className="border-neutral-800" />

        {/* Urgency Selector */}
        <section className="py-8">
          <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-4">
            HOW SOON DO YOU NEED THEM?
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {(['NOW', 'SCHEDULE'] as const).map((option) => {
              const active = urgency === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setUrgency(option)}
                  className={`rounded-xl py-3.5 text-xs font-bold tracking-wider uppercase border transition ${
                    active
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </section>

        <hr className="border-neutral-800" />

        {/* Explore People Categories */}
        <section className="py-8">
          <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-4">
            EXPLORE PEOPLE
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(active ? null : cat.id)
                  }
                  className={`rounded-xl px-4 py-3.5 text-left text-sm font-medium border transition ${
                    active
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-950 text-white border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </section>

        <hr className="border-neutral-800" />

        {/* People Near You Discovery Feeds */}
        <section className="py-8 space-y-6">
          <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400">
            PEOPLE NEAR YOU
          </h2>

          <div className="space-y-3">
            <Link
              href="/search?feed=available&when=now"
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 flex items-center justify-between hover:border-neutral-600 transition"
            >
              <div>
                <div className="text-sm font-semibold text-white">Available now</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Ready to pull up in under 60 minutes
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </Link>

            <Link
              href="/search?feed=popular"
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 flex items-center justify-between hover:border-neutral-600 transition"
            >
              <div>
                <div className="text-sm font-semibold text-white">Popular in your area</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Highest-rated local talent this week
                </div>
              </div>
              <span className="text-xs text-neutral-400">→</span>
            </Link>

            <Link
              href="/search?feed=recent"
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 flex items-center justify-between hover:border-neutral-600 transition"
            >
              <div>
                <div className="text-sm font-semibold text-white">Recently booked</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Live appearances completed nearby
                </div>
              </div>
              <span className="text-xs text-neutral-400">→</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}