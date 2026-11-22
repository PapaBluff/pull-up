'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'home-help', label: 'Home Help' },
  { id: 'social', label: 'Social' },
  { id: 'creators', label: 'Creators' },
  { id: 'learning', label: 'Learning' },
  { id: 'experiences', label: 'Experiences' },
]

type FeaturedCreator = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  hourly_rate: number | null
  stripe_account_id: string | null
}

function getDefaultDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

export default function HomePage() {
  const router = useRouter()

  const [urgency, setUrgency] = useState<'NOW' | 'SCHEDULE'>('NOW')
  const [scheduledDate, setScheduledDate] = useState<string>(getDefaultDate)
  const [scheduledTime, setScheduledTime] = useState<string>('19:00')

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [currentDisplayName, setCurrentDisplayName] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [featured, setFeatured] = useState<FeaturedCreator[]>([])

  useEffect(() => {
    async function loadSessionAndFeatured() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        setCurrentUsername(
          myProfile?.username || user.user_metadata?.username || null
        )
        setCurrentDisplayName(
          myProfile?.full_name || user.user_metadata?.full_name || user.email || null
        )
        setCurrentAvatarUrl(myProfile?.avatar_url || null)
      } else {
        setIsLoggedIn(false)
        setCurrentUsername(null)
        setCurrentDisplayName(null)
        setCurrentAvatarUrl(null)
      }

      const { data: creators } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, hourly_rate, stripe_account_id')
        .eq('role', 'creator')
        .order('created_at', { ascending: false })
        .limit(4)

      if (creators) {
        setFeatured(creators)
      }
    }

    loadSessionAndFeatured()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setCurrentUsername(null)
    setCurrentDisplayName(null)
    setCurrentAvatarUrl(null)
    router.refresh()
  }

  function buildSearchParams(overrideCategory?: string) {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    params.set('when', urgency.toLowerCase())
    if (urgency === 'SCHEDULE') {
      if (scheduledDate) params.set('date', scheduledDate)
      if (scheduledTime) params.set('time', scheduledTime)
    }
    const cat = overrideCategory ?? selectedCategory
    if (cat && cat !== 'all') {
      params.set('category', cat)
    }
    return params.toString()
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/search?${buildSearchParams()}`)
  }

  function handleCategoryClick(categoryId: string) {
    setSelectedCategory(categoryId)
    router.push(`/search?${buildSearchParams(categoryId)}`)
  }

  function buildPullUpHref(person: FeaturedCreator) {
    const params = new URLSearchParams()
    params.set('book', '1')
    params.set('when', urgency.toLowerCase())
    if (urgency === 'SCHEDULE') {
      if (scheduledDate) params.set('date', scheduledDate)
      if (scheduledTime) params.set('time', scheduledTime)
    }
    if (person.username) {
      return `/u/${person.username}?${params.toString()}`
    }
    const searchFallback = new URLSearchParams()
    if (person.full_name) searchFallback.set('q', person.full_name)
    searchFallback.set('when', urgency.toLowerCase())
    return `/search?${searchFallback.toString()}`
  }

  const todayMin = new Date().toISOString().split('T')[0]
  const signedInLabel = currentUsername
    ? `@${currentUsername}`
    : currentDisplayName || 'SIGNED IN'
  const signedInInitial = (currentDisplayName || currentUsername || 'U')
    .charAt(0)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between gap-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight shrink-0">
          PULL UP
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap justify-end">
            {/* Signed-In User Indicator */}
            <Link
              href={currentUsername ? `/u/${currentUsername}` : '/dashboard/profile'}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-[11px] font-bold text-white hover:border-neutral-600 transition"
            >
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt={signedInLabel}
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <span className="h-4 w-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-extrabold">
                  {signedInInitial}
                </span>
              )}
              <span className="max-w-[110px] truncate">{signedInLabel}</span>
            </Link>

            {currentUsername && (
              <Link
                href={`/u/${currentUsername}`}
                className="text-xs font-semibold tracking-wider uppercase text-neutral-300 hover:text-white transition"
              >
                MY PROFILE
              </Link>
            )}

            <Link
              href="/dashboard/profile"
              className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-bold tracking-wider uppercase text-white hover:border-white transition"
            >
              EDIT PROFILE
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-semibold tracking-wider uppercase text-neutral-400 hover:text-red-400 transition"
            >
              LOG OUT
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

      <main className="w-full max-w-xl px-6 pb-20 flex flex-col">
        {/* Hero & Dispatch Controls */}
        <section className="pt-8 pb-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase leading-none">
              WHO IS PULLING UP?
            </h1>
            <p className="text-sm text-neutral-400">
              Book real people and creators for in-person appearances right now or on schedule.
            </p>
          </div>

          {/* NOW / SCHEDULE Switcher */}
          <div className="grid grid-cols-2 rounded-xl border border-neutral-800 bg-neutral-950 p-1">
            {(['NOW', 'SCHEDULE'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setUrgency(mode)}
                className={`py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition ${
                  urgency === mode
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Interactive Calendar & Time Picker when SCHEDULE is selected */}
          {urgency === 'SCHEDULE' && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">
                SELECT APPEARANCE DATE & TIME
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    DATE
                  </label>
                  <input
                    type="date"
                    min={todayMin}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    TIME
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, @handle, or vibe..."
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-white py-4 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
            >
              {urgency === 'SCHEDULE'
                ? `FIND TALENT FOR ${scheduledDate}`
                : 'FIND SOMEONE'}
            </button>
          </form>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border transition ${
                    active
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </section>

        <hr className="border-neutral-800" />

        {/* Quick Feeds */}
        <section className="py-6 grid grid-cols-3 gap-2.5">
          <Link
            href={`/search?${buildSearchParams()}&feed=available`}
            className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-center hover:border-neutral-600 transition"
          >
            <div className="text-[11px] font-bold tracking-wider uppercase text-white">
              AVAILABLE NOW
            </div>
          </Link>

          <Link
            href={`/search?${buildSearchParams()}&feed=popular`}
            className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-center hover:border-neutral-600 transition"
          >
            <div className="text-[11px] font-bold tracking-wider uppercase text-white">
              POPULAR
            </div>
          </Link>

          <Link
            href={`/search?${buildSearchParams()}&feed=recent`}
            className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-center hover:border-neutral-600 transition"
          >
            <div className="text-[11px] font-bold tracking-wider uppercase text-white">
              NEW TALENT
            </div>
          </Link>
        </section>

        {/* Featured Creators Preview */}
        {featured.length > 0 && (
          <>
            <hr className="border-neutral-800" />
            <section className="py-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                  ON DISPATCH
                </h2>
                <Link
                  href={`/search?${buildSearchParams()}`}
                  className="text-xs font-semibold text-neutral-400 hover:text-white transition"
                >
                  VIEW ALL →
                </Link>
              </div>

              <div className="space-y-2.5">
                {featured.map((person) => {
                  const displayName = person.full_name || person.username || 'PULL UP Talent'
                  const initial = displayName.charAt(0).toUpperCase()
                  const profileHref = person.username
                    ? `/u/${person.username}`
                    : buildPullUpHref(person)

                  return (
                    <div
                      key={person.id}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 flex items-center justify-between gap-4"
                    >
                      <Link href={profileHref} className="flex items-center gap-3 min-w-0 flex-1">
                        {person.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt={displayName}
                            className="h-10 w-10 rounded-full object-cover border border-neutral-800 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {displayName}
                            </span>
                            {person.stripe_account_id && (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                            )}
                          </div>
                          {person.username && (
                            <p className="text-xs text-neutral-400 truncate">
                              @{person.username}
                            </p>
                          )}
                        </div>
                      </Link>

                      <Link
                        href={buildPullUpHref(person)}
                        className="shrink-0 rounded-lg bg-white px-3.5 py-2 text-[11px] font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
                      >
                        PULL UP
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}