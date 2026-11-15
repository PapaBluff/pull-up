import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Play, ArrowRight, Sparkles } from 'lucide-react'

const CATEGORIES = [
  'Creator video',
  'Photographer',
  'DJ',
  'Host',
  'Videographer',
  'Entertainer',
]

const FEATURED_CREATORS = [
  {
    id: '1',
    name: 'Alex Rivera',
    handle: '@arivera',
    category: 'Videographer & Creator',
    location: 'Atlanta, GA',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    tags: ['Reels', 'Brand Shoots', '4K Video'],
  },
  {
    id: '2',
    name: 'Marcus Vance',
    handle: '@marcusvance',
    category: 'DJ & Live Host',
    location: 'Metro Atlanta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    tags: ['Nightlife', 'Corporate Events', 'Pop-ups'],
  },
]

const ACTIVE_BOUNTIES = [
  {
    id: '1',
    title: 'Restaurant needs a creator for grand opening',
    budget: '$450',
    location: 'Downtown Midtown',
    date: 'This Friday',
    category: 'Creator Video',
  },
  {
    id: '2',
    title: 'Event needs a photographer this Saturday',
    budget: '$600',
    location: 'Buckhead',
    date: 'This Saturday',
    category: 'Photographer',
  },
  {
    id: '3',
    title: 'Brand needs three people for launch campaign',
    budget: '$1,200',
    location: 'Atlanta Hub',
    date: 'Next Week',
    category: 'Talent Bundle',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight text-white uppercase">
            PULL UP
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white transition-colors"
            >
              LOG IN
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:bg-neutral-200 transition-all"
            >
              JOIN
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-neutral-800 px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-black uppercase tracking-tight sm:text-7xl md:text-8xl leading-none">
              THE RIGHT PEOPLE.
              <br />
              <span className="text-neutral-400">THE RIGHT PLACE.</span>
              <br />
              <span className="text-white">THE RIGHT TIME.</span>
            </h1>

            <p className="mt-8 text-lg font-medium text-neutral-400 sm:text-xl">
              Find somebody who can make it happen.
            </p>

            <form action="/search" className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:rounded-2xl sm:border sm:border-neutral-800 sm:bg-neutral-950 sm:p-2 sm:shadow-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  name="q"
                  placeholder="What are you looking for?"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3.5 pl-12 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white sm:border-0 sm:bg-transparent"
                />
              </div>

              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3.5 pl-12 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white sm:border-0 sm:bg-transparent"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-neutral-200"
              >
                SEARCH
              </button>
            </form>
          </div>
        </section>

        <section className="border-b border-neutral-800 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-xs font-bold tracking-widest text-neutral-500 uppercase">
              WHO'S OUT THERE?
            </h2>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/search?category=${encodeURIComponent(cat)}`}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 text-center transition-all hover:border-neutral-500 hover:bg-neutral-900"
                >
                  <span className="text-sm font-semibold text-neutral-300 group-hover:text-white">
                    {cat}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-800 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-xs font-bold tracking-widest text-neutral-500 uppercase">
              PEOPLE TO KNOW
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {FEATURED_CREATORS.map((creator) => (
                <div
                  key={creator.id}
                  className="group overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 transition-all hover:border-neutral-600"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                    <Image
                      src={creator.avatar}
                      alt={creator.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <button className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/30 transition-colors">
                      <Play className="h-3.5 w-3.5 fill-white" /> Watch video
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{creator.name}</h3>
                        <p className="text-sm font-medium text-neutral-400">{creator.handle} • {creator.category}</p>
                      </div>
                      <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-neutral-400 border border-neutral-800">
                        {creator.location}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {creator.tags.map((tag) => (
                        <span key={tag} className="text-xs font-medium text-neutral-500">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                      <Link
                        href={`/creator/${creator.id}`}
                        className="flex-1 rounded-xl border border-neutral-700 bg-white py-3 text-center text-sm font-bold text-black transition-all hover:bg-neutral-200"
                      >
                        Book them
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-12 text-center text-lg font-medium text-neutral-400">
              Watch their videos. See what they do. <span className="text-white font-bold">Book them.</span>
            </p>
          </div>
        </section>

        <section className="border-b border-neutral-800 px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-xs font-bold tracking-widest text-neutral-500 uppercase">
              WHAT'S HAPPENING?
            </h2>

            <div className="mt-12 space-y-4">
              {ACTIVE_BOUNTIES.map((bounty) => (
                <div
                  key={bounty.id}
                  className="group flex flex-col justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 transition-all hover:border-neutral-600 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                      <span>{bounty.category}</span>
                      <span>•</span>
                      <span>{bounty.location}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-white group-hover:text-neutral-200">
                      {bounty.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <span className="text-xl font-black text-white">{bounty.budget}</span>
                    <Link
                      href={`/bounties/${bounty.id}`}
                      className="flex items-center gap-1.5 rounded-xl border border-neutral-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-black"
                    >
                      Apply <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-32 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-4 py-1.5 text-xs font-medium text-neutral-400">
              <Sparkles className="h-3.5 w-3.5 text-white" /> Talent & Creators
            </div>

            <h2 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl uppercase">
              MAKE SOMETHING HAPPEN.
            </h2>

            <p className="mt-4 text-xl font-medium text-neutral-400">
              Have a talent? Get discovered.
            </p>

            <div className="mt-10">
              <Link
                href="/signup"
                className="inline-block rounded-full bg-white px-10 py-4 text-base font-bold text-black transition-all hover:bg-neutral-200 hover:scale-105"
              >
                JOIN PULL UP
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-900 px-6 py-10 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} PULL UP. All rights reserved.
      </footer>
    </div>
  )
}
