'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ProfileLink = {
  label: string
  url: string
  verified?: boolean
}

type PublicProfile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  links: ProfileLink[] | null
  media_urls: string[] | null
  role: string | null
  hourly_rate: number | null
  stripe_account_id: string | null
}

export default function PublicCreatorProfilePage() {
  const params = useParams<{ username: string }>()
  const searchParams = useSearchParams()

  const rawUsername = params?.username || ''
  const cleanUsername = decodeURIComponent(rawUsername).toLowerCase().replace(/^@+/, '')
  const autoOpenBook = searchParams.get('book') === '1'

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(autoOpenBook)
  const [bookingMode, setBookingMode] = useState<'now' | 'schedule'>(
    searchParams.get('when') === 'schedule' ? 'schedule' : 'now'
  )
  const [bookingDate, setBookingDate] = useState(searchParams.get('date') || '')
  const [bookingTime, setBookingTime] = useState(searchParams.get('time') || '')
  const [bookingHours, setBookingHours] = useState('2')
  const [bookingLocation, setBookingLocation] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingSubmitted, setBookingSubmitted] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, full_name, avatar_url, bio, links, media_urls, role, hourly_rate, stripe_account_id'
        )
        .ilike('username', cleanUsername)
        .maybeSingle()

      if (error || !data) {
        setNotFoundState(true)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    if (cleanUsername) {
      loadProfile()
    }
  }, [cleanUsername])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-xs uppercase tracking-widest text-neutral-500">
        LOADING PROFILE...
      </div>
    )
  }

  if (notFoundState || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center space-y-4">
        <h1 className="text-xl font-extrabold uppercase">PROFILE NOT FOUND</h1>
        <p className="text-xs text-neutral-400">
          No user exists with @{cleanUsername}.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black"
        >
          BACK TO HOME
        </Link>
      </div>
    )
  }

  const displayName = profile.full_name || profile.username || 'PULL UP Talent'
  const initial = displayName.charAt(0).toUpperCase()
  const isCreator = profile.role === 'creator'
  const isVerified = Boolean(profile.stripe_account_id)

  // Only show and allow clicking links that have been verified
  const verifiedLinks: ProfileLink[] = Array.isArray(profile.links)
    ? profile.links.filter((link) => Boolean(link.verified && link.url))
    : []

  const mediaUrls: string[] = Array.isArray(profile.media_urls) ? profile.media_urls : []
  const estimatedTotal =
    profile.hourly_rate != null
      ? Number(profile.hourly_rate) * Math.max(1, Number(bookingHours) || 1)
      : null

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Full-Screen Profile Picture Lightbox */}
      {avatarLightboxOpen && profile.avatar_url && (
        <div
          onClick={() => setAvatarLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="relative max-w-lg w-full">
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-neutral-800"
            />
            <button
              type="button"
              onClick={() => setAvatarLightboxOpen(false)}
              className="mt-4 w-full rounded-xl border border-neutral-700 bg-neutral-950 py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          PULL UP
        </Link>
        <Link
          href="/search"
          className="text-xs font-semibold tracking-wider uppercase text-neutral-400 hover:text-white transition"
        >
          EXPLORE ALL →
        </Link>
      </header>

      <main className="w-full max-w-xl px-6 pb-20 flex flex-col">
        {/* Identity Header */}
        <section className="pt-8 pb-6 flex flex-col items-center text-center">
          {profile.avatar_url ? (
            <button
              type="button"
              onClick={() => setAvatarLightboxOpen(true)}
              title="Click to view profile picture larger"
              className="group relative h-24 w-24 rounded-full overflow-hidden border border-neutral-800 mb-5 cursor-zoom-in"
            >
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover group-hover:scale-105 transition"
              />
            </button>
          ) : (
            <div className="h-24 w-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl font-extrabold text-white mb-5">
              {initial}
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {displayName}
            </h1>
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                VERIFIED
              </span>
            )}
          </div>

          {profile.username && (
            <p className="text-sm text-neutral-400 mt-1">@{profile.username}</p>
          )}

          {profile.bio && (
            <p className="text-sm text-neutral-300 mt-4 max-w-md leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Only Verified Links Are Shown & Clickable */}
          {verifiedLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {verifiedLinks.map((link, idx) => (
                <a
                  key={`${link.url}-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-1.5 text-xs font-semibold text-white hover:border-white transition"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          )}
        </section>

        <hr className="border-neutral-800" />

        {/* Booking Section */}
        {isCreator && (
          <section id="book" className="py-6 space-y-5">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                  APPEARANCE RATE
                </div>
                <div className="text-2xl font-extrabold text-white mt-1">
                  {profile.hourly_rate != null ? (
                    <>
                      ${profile.hourly_rate}
                      <span className="text-xs font-semibold text-neutral-400 ml-1">/ HR</span>
                    </>
                  ) : (
                    <span className="text-base font-semibold text-neutral-300">Rate on request</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                  ESCROW
                </div>
                <div className="text-xs font-semibold text-neutral-300 mt-1">
                  {isVerified ? 'Stripe Protected' : 'Pending Verification'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setBookingMode('now')
                  setBookingOpen(true)
                  setBookingSubmitted(false)
                }}
                className="w-full rounded-xl bg-white py-4 text-center text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
              >
                PULL UP NOW
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingMode('schedule')
                  setBookingOpen(true)
                  setBookingSubmitted(false)
                }}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-4 text-center text-xs font-bold tracking-wider uppercase text-white hover:border-neutral-600 transition"
              >
                SCHEDULE APPEARANCE
              </button>
            </div>

            {bookingOpen && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-white">
                    {bookingMode === 'now' ? 'IMMEDIATE DISPATCH REQUEST' : 'SCHEDULED APPEARANCE'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBookingOpen(false)}
                    className="text-xs text-neutral-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {bookingSubmitted ? (
                  <div className="rounded-xl border border-emerald-800 bg-emerald-950/60 p-4 text-xs text-emerald-300 space-y-1">
                    <p className="font-bold uppercase">DISPATCH REQUEST SENT</p>
                    <p>
                      {displayName} has been notified for your{' '}
                      {bookingMode === 'now'
                        ? 'immediate pull up'
                        : `${bookingDate || 'scheduled'} appearance`}
                      .
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setBookingSubmitted(true)
                    }}
                    className="space-y-3"
                  >
                    {bookingMode === 'schedule' && (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-3 text-xs text-white [color-scheme:dark]"
                        />
                        <input
                          type="time"
                          required
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-3 text-xs text-white [color-scheme:dark]"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        value={bookingLocation}
                        onChange={(e) => setBookingLocation(e.target.value)}
                        placeholder="Address or venue"
                        className="col-span-2 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-3 text-xs text-white placeholder-neutral-500"
                      />
                      <select
                        value={bookingHours}
                        onChange={(e) => setBookingHours(e.target.value)}
                        className="col-span-1 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-3 text-xs text-white"
                      >
                        <option value="1">1 hr</option>
                        <option value="2">2 hrs</option>
                        <option value="3">3 hrs</option>
                        <option value="4">4 hrs</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Vibe, dress code, or arrival instructions..."
                      className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-3 text-xs text-white placeholder-neutral-500"
                    />

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-white py-3.5 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
                    >
                      {estimatedTotal != null
                        ? `CONFIRM & LOCK $${estimatedTotal}`
                        : 'SEND PULL UP REQUEST'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>
        )}

        {/* Uploaded Photos & Content */}
        {mediaUrls.length > 0 && (
          <section className="py-6 space-y-4">
            <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400">
              FEATURED CONTENT
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaUrls.map((url) => {
                const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url)
                return (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 block"
                  >
                    {isVideo ? (
                      <video
                        src={url}
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                      />
                    ) : (
                      <img
                        src={url}
                        alt={displayName}
                        className="h-full w-full object-cover hover:scale-105 transition duration-300"
                      />
                    )}
                  </a>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}