import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Play, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    location?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = params.q || ''
  const category = params.category || ''
  const location = params.location || ''

  let creators: any[] = []

  try {
    const supabase = await createClient()
    let dbQuery = supabase.from('profiles').select('*')

    if (category) {
      dbQuery = dbQuery.ilike('category', `%${category}%`)
    }
    if (q) {
      dbQuery = dbQuery.or(`full_name.ilike.%${q}%,category.ilike.%${q}%`)
    }
    if (location) {
      dbQuery = dbQuery.ilike('location', `%${location}%`)
    }

    const { data } = await dbQuery
    if (data) {
      creators = data
    }
  } catch (err) {
    console.error('Failed to fetch creators:', err)
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="border-b border-neutral-800 bg-black/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <span className="text-xl font-black uppercase tracking-tight text-white">PULL UP</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            {category ? `${category} Talent` : 'Search Talent'}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {location || q ? `Showing results ${location ? `near "${location}"` : ''} ${q ? `matching "${q}"` : ''}` : 'Find creator talent in your area'}
          </p>

          <form action="/search" method="GET" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:rounded-2xl sm:border sm:border-neutral-800 sm:bg-neutral-950 sm:p-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="What are you looking for?"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3.5 pl-12 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none sm:border-0 sm:bg-transparent"
              />
            </div>

            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                name="location"
                defaultValue={location}
                placeholder="Location"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3.5 pl-12 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none sm:border-0 sm:bg-transparent"
              />
            </div>

            {category && <input type="hidden" name="category" value={category} />}

            <button
              type="submit"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-neutral-200"
            >
              SEARCH
            </button>
          </form>
        </div>

        {creators.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-12 text-center">
            <h3 className="text-lg font-bold text-white">No talent found</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Try adjusting your query or expanding your search location.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {creators.map((creator) => (
              <div
                key={creator.id}
                className="group overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 transition-all hover:border-neutral-600"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                  {creator.avatar_url && (
                    <Image
                      src={creator.avatar_url}
                      alt={creator.full_name || 'Creator'}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <button className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/30">
                    <Play className="h-3.5 w-3.5 fill-white" /> Watch video
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{creator.full_name || creator.username}</h3>
                      <p className="text-sm font-medium text-neutral-400">@{creator.username} • {creator.category}</p>
                    </div>
                    <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-400">
                      {creator.location || 'Local'}
                    </span>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/${creator.username || creator.id}`}
                      className="block rounded-xl border border-neutral-700 bg-white py-3 text-center text-sm font-bold text-black transition-all hover:bg-neutral-200"
                    >
                      Book them
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}