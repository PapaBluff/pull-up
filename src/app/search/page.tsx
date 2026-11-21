'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

type CreatorProfile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  role: string | null
  hourly_rate: number | null
  stripe_account_id: string | null
  created_at: string | null
  phone_number: string | null
}

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const initialQuery = searchParams.get('q') || ''
  const initialWhen = (searchParams.get('when')?.toUpperCase() === 'SCHEDULE'
    ? 'SCHEDULE'
    : 'NOW') as 'NOW' | 'SCHEDULE'
  const initialCategory = searchParams.get('category') || 'all'
  const feed = searchParams.get('feed') || null

  const [query, setQuery] = useState(initialQuery)
  const [urgency, setUrgency] = useState<'NOW' | 'SCHEDULE'>(initialWhen)
  const [category, setCategory] = useState(initialCategory)
  const [results, setResults] = useState<CreatorProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCreators() {
      setLoading(true)

      let dbQuery = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, role, hourly_rate, stripe_account_id, created_at, phone_number')
        .eq('role', 'creator')

      if (query.trim()) {
        const term = `%${query.trim()}%`
        dbQuery = dbQuery.or(`full_name.ilike.${term},username.ilike.${term}`)
      }

      if (feed === 'recent') {
        dbQuery = dbQuery.order('created_at', { ascending: false })
      } else {
        dbQuery = dbQuery.order('created_at', { ascending: false })
      }

      const { data, error } = await dbQuery.limit(24)

      if (!error && data) {
        setResults(data)
      } else {
        setResults([])
      }
      setLoading(false)
    }

    fetchCreators()
  }, [supabase, query, category, feed])

  function updateFilters(nextQuery: string, nextWhen: 'NOW' | 'SCHEDULE', nextCat: string) {
    const params = new URLSearchParams()
    if (nextQuery.trim()) params.set('q', nextQuery.trim())
    params.set('when', nextWhen.toLowerCase())
    if (nextCat && nextCat !== 'all') params.set('category', nextCat)
    if (feed) params.set('feed', feed)
    router.replace(`/search?${params.toString()}`)
  }

  const feedTitle =
    feed === 'available'
      ? 'AVAILABLE NOW'
      : feed === 'popular'
      ? 'POPULAR IN YOUR AREA'
      : feed === 'recent'
      ? 'RECENTLY BOOKED'
      : 'DISPATCH RESULTS'

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Top Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          PULL UP
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold tracking-wider uppercase text-neutral-400 hover:text-white transition"
        >
          ← BACK
        </Link>
      </header>

      <main className="w-full max-w-xl px-6 pb-20 flex flex-col">
        {/* Search & Urgency Bar */}
        <section className="pt-4 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight uppercase">
              {feedTitle}
            </h1>
            <div className="flex rounded-lg border border-neutral-800 bg-neutral-950 p-0.5">
              {(['NOW', 'SCHEDULE'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setUrgency(opt)
                    updateFilters(query, opt, category)
                  }}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider uppercase transition ${
                    urgency === opt
                      ? 'bg-white text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              updateFilters(e.target.value, urgency, category)
            }}
            placeholder="Search by name or @username..."
            className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
          />

          {/* Horizontal Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id)
                    updateFilters(query, urgency, cat.id)
                  }}
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

        {/* Results Feed */}
        <section className="py-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-24 rounded-xl border border-neutral-900 bg-neutral-950 animate-pulse"
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-white">No talent matched that search yet</p>
              <p className="text-xs text-neutral-400">
                Try clearing your search filter to see all available creators.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCategory('all')
                  router.replace('/search')
                }}
                className="mt-2 inline-block rounded-xl bg-white px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
              >
                VIEW ALL TALENT
              </button>
            </div>
          ) : (
            results.map((person) => {
              const displayName = person.full_name || person.username || 'PULL UP Talent'
              const initial = displayName.charAt(0).toUpperCase()

              return (
                <div
                  key={person.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 flex items-center justify-between gap-4 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={displayName}
                        className="h-12 w-12 rounded-full object-cover border border-neutral-800 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {initial}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white truncate">
                          {displayName}
                        </h2>
                        {person.stripe_account_id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            VERIFIED
                          </span>
                        )}
                      </div>

                      {person.username && (
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">
                          @{person.username}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                        {person.hourly_rate != null ? (
                          <span className="font-semibold text-white">
                            ${person.hourly_rate}/hr
                          </span>
                        ) : (
                          <span>Rate on request</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/book/${person.id}?when=${urgency.toLowerCase()}`}
                    className="shrink-0 rounded-xl bg-white px-4 py-3 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
                  >
                    PULL UP
                  </Link>
                </div>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center text-xs uppercase tracking-widest text-neutral-500">
          LOADING...
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  )
}