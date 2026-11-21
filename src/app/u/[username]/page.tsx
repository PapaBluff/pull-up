import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ username: string }>
}

export default async function PublicCreatorProfilePage({ params }: Props) {
  const { username } = await params
  const cleanUsername = decodeURIComponent(username).toLowerCase().replace(/^@+/, '')

  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, role, hourly_rate, stripe_account_id, created_at')
    .eq('username', cleanUsername)
    .single()

  if (error || !profile) {
    notFound()
  }

  const displayName = profile.full_name || profile.username || 'PULL UP Talent'
  const initial = displayName.charAt(0).toUpperCase()
  const isCreator = profile.role === 'creator'
  const isVerified = Boolean(profile.stripe_account_id)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
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
        <section className="pt-8 pb-8 flex flex-col items-center text-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-24 w-24 rounded-full object-cover border border-neutral-800 mb-5"
            />
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
        </section>

        <hr className="border-neutral-800" />

        {/* Rate & Dispatch Card */}
        {isCreator ? (
          <section className="py-8 space-y-6">
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

            {/* Direct Booking Actions */}
            <div className="space-y-3">
              <Link
                href={`/dashboard/book/${profile.id}?when=now`}
                className="block w-full rounded-xl bg-white py-4 text-center text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
              >
                PULL UP NOW
              </Link>

              <Link
                href={`/dashboard/book/${profile.id}?when=schedule`}
                className="block w-full rounded-xl border border-neutral-800 bg-neutral-950 py-4 text-center text-xs font-bold tracking-wider uppercase text-white hover:border-neutral-600 transition"
              >
                SCHEDULE APPEARANCE
              </Link>
            </div>
          </section>
        ) : (
          <section className="py-8 text-center">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-3">
              <p className="text-sm font-semibold text-white">Member Profile</p>
              <p className="text-xs text-neutral-400">
                This user books talent on PULL UP.
              </p>
              <Link
                href="/search"
                className="inline-block mt-2 rounded-xl bg-white px-5 py-3 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 transition"
              >
                BROWSE TALENT
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}