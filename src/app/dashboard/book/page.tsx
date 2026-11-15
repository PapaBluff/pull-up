'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, MapPin, DollarSign, Calendar, Loader2 } from 'lucide-react'

interface CreatorOption {
  id: string
  full_name?: string
  username?: string
}

export default function CreateBookingPage() {
  const supabase = createClient()
  const [creators, setCreators] = useState<CreatorOption[]>([])
  const [creatorId, setCreatorId] = useState('')
  const [venueName, setVenueName] = useState('')
  const [eventAddress, setEventAddress] = useState('')
  const [venueLat, setVenueLat] = useState('')
  const [venueLng, setVenueLng] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [creatorPayout, setCreatorPayout] = useState('500')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCreators() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .limit(50)

      if (data) {
        setCreators(data)
        if (data.length > 0) setCreatorId(data[0].id)
      }
    }
    loadCreators()
  }, [supabase])

  const payoutNum = Number(creatorPayout || 0)
  const platformFee = Math.round(payoutNum * 0.15 * 100) / 100
  const totalDue = payoutNum + platformFee

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Grab active session token to prevent Unauthorized errors
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          creatorId,
          venueName,
          eventAddress,
          venueLat: venueLat ? Number(venueLat) : null,
          venueLng: venueLng ? Number(venueLng) : null,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
          creatorPayout: payoutNum,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to initiate escrow checkout.')
      }

      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-xl space-y-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Escrow-Protected Booking
          </span>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Book a Creator Appearance</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Funds are held securely in escrow until GPS telemetry or your 4-digit PIN verifies arrival.
          </p>
        </div>

        <form onSubmit={handleCheckout} className="space-y-5 rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Select Talent
            </label>
            <select
              value={creatorId}
              onChange={(e) => setCreatorId(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.username || c.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Venue Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., The Tabernacle"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Full Street Address
            </label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                required
                placeholder="152 Luckie St NW, Atlanta, GA 30303"
                value={eventAddress}
                onChange={(e) => setEventAddress(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black py-2.5 pl-10 pr-3.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Venue Latitude (Geofence)
              </label>
              <input
                type="text"
                placeholder="33.7586"
                value={venueLat}
                onChange={(e) => setVenueLat(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Venue Longitude (Geofence)
              </label>
              <input
                type="text"
                placeholder="-84.3913"
                value={venueLng}
                onChange={(e) => setVenueLng(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Appearance Date & Time
              </label>
              <div className="relative mt-2">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-black py-2 pl-9 pr-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Creator Offer (USD)
              </label>
              <div className="relative mt-2">
                <DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="number"
                  min="50"
                  step="1"
                  required
                  value={creatorPayout}
                  onChange={(e) => setCreatorPayout(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-black py-2 pl-8 pr-3 text-sm font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Escrow Fee Summary */}
          <div className="space-y-2 rounded-2xl border border-neutral-800 bg-black p-4 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Creator Escrow Payout</span>
              <span className="font-mono text-white">${payoutNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Platform & Verification Fee (15%)</span>
              <span className="font-mono text-white">${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-800 pt-2 text-sm font-bold text-emerald-400">
              <span>Total Escrow Deposit</span>
              <span className="font-mono">${totalDue.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-900 bg-rose-950/50 p-3 text-xs text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !creatorId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing Stripe Escrow...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>Fund Escrow & Lock Booking (${totalDue.toFixed(2)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}