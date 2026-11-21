'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ProfileEditorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole] = useState<'host' | 'creator'>('host')
  const [hourlyRate, setHourlyRate] = useState('')
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url, role, hourly_rate, stripe_account_id, phone_number')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setUsername(profile.username || '')
        setAvatarUrl(profile.avatar_url || '')
        setPhoneNumber(profile.phone_number || '')
        setRole(profile.role === 'creator' ? 'creator' : 'host')
        setHourlyRate(profile.hourly_rate != null ? String(profile.hourly_rate) : '')
        setStripeAccountId(profile.stripe_account_id || null)
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    setMessage(null)

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .replace(/[^a-z0-9_]/g, '')

    const parsedRate =
      role === 'creator' && hourlyRate.trim() !== ''
        ? Math.max(0, Number(hourlyRate))
        : null

    if (role === 'creator' && hourlyRate.trim() !== '' && Number.isNaN(parsedRate)) {
      setMessage({ type: 'error', text: 'Please enter a valid dollar amount for your hourly rate.' })
      setSaving(false)
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName.trim() || null,
      username: cleanUsername || null,
      avatar_url: avatarUrl.trim() || null,
      phone_number: phoneNumber.trim() || null,
      role,
      hourly_rate: parsedRate,
    })

    if (error) {
      const isDuplicate = error.message.toLowerCase().includes('unique')
      setMessage({
        type: 'error',
        text: isDuplicate
          ? 'That @username is already taken. Try another one.'
          : error.message,
      })
    } else {
      setUsername(cleanUsername)
      setMessage({ type: 'success', text: 'Profile saved.' })
      router.refresh()
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-xs uppercase tracking-widest text-neutral-500">
        LOADING PROFILE...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Top Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          PULL UP
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/telemetry"
            className="text-xs font-semibold tracking-wider uppercase text-neutral-400 hover:text-white transition"
          >
            TELEMETRY
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold tracking-wider uppercase text-neutral-400 hover:text-white transition"
          >
            DISPATCH
          </Link>
        </div>
      </header>

      <main className="w-full max-w-xl px-6 pb-20 flex flex-col">
        <section className="pt-4 pb-6">
          <h1 className="text-2xl font-extrabold tracking-tight uppercase">
            YOUR PROFILE
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {email}
          </p>
        </section>

        <hr className="border-neutral-800" />

        <form onSubmit={handleSave} className="py-6 space-y-6">
          {/* Role Switcher */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-3">
              ACCOUNT MODE
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('host')}
                className={`rounded-xl py-3.5 px-4 text-xs font-bold tracking-wider uppercase border transition ${
                  role === 'host'
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                }`}
              >
                BOOK TALENT
              </button>
              <button
                type="button"
                onClick={() => setRole('creator')}
                className={`rounded-xl py-3.5 px-4 text-xs font-bold tracking-wider uppercase border transition ${
                  role === 'creator'
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                }`}
              >
                PULL UP AS TALENT
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              FULL NAME
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name or stage name"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              USERNAME
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-8 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              PHONE NUMBER (FOR DISPATCH UPDATES)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
              PHOTO URL
            </label>
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="h-12 w-12 rounded-full object-cover border border-neutral-800 shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-400 shrink-0">
                  {(fullName || username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
              />
            </div>
          </div>

          {/* Creator-Only Rate & Payout Status */}
          {role === 'creator' && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-neutral-400 mb-2">
                  HOURLY RATE (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="150"
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-8 pr-14 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                    / HR
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white">
                    STRIPE PAYOUTS
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {stripeAccountId
                      ? 'Connected & verified to appear in search'
                      : 'Connect Stripe to receive escrow payouts'}
                  </div>
                </div>

                {stripeAccountId ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 border border-emerald-800 px-3 py-1 text-[11px] font-bold uppercase text-emerald-300 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    VERIFIED
                  </span>
                ) : (
                  <Link
                    href="/dashboard/telemetry"
                    className="shrink-0 rounded-lg border border-white px-3.5 py-2 text-[11px] font-bold tracking-wider uppercase text-white hover:bg-white hover:text-black transition"
                  >
                    CONNECT
                  </Link>
                )}
              </div>
            </div>
          )}

          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-xs font-medium ${
                message.type === 'success'
                  ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300'
                  : 'border-red-800 bg-red-950/60 text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-white py-4 text-xs font-bold tracking-wider uppercase text-black hover:bg-neutral-200 disabled:opacity-50 transition"
          >
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </form>
      </main>
    </div>
  )
}