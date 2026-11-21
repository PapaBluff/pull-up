'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BookingDetailPageProps {
  params: Promise<{ id: string }>
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [releasing, setReleasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch booking details')
        setBooking(data.booking)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [id])

  async function handleReleaseEscrow() {
    if (!confirm('Are you sure you want to release the escrow funds to the creator?')) return

    setReleasing(true)
    try {
      const res = await fetch('/api/bookings/release-escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to release escrow')

      alert('Escrow released successfully!')
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setReleasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-neutral-400">Loading appearance details...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
        <p className="text-sm text-red-400 mb-4">{error || 'Booking not found'}</p>
        <Link href="/dashboard/telemetry" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">
          Back to Operations Board
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Top Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard/telemetry" className="text-sm text-neutral-400 hover:text-white transition">
            ← Back
          </Link>
          <span className="text-xl font-bold tracking-tight">PULL UP</span>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2 font-mono">
            BOOKING #{booking.id.slice(0, 8)}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">APPEARANCE DETAILS</h1>
          <p className="text-sm text-neutral-400">Scheduled venue arrival and telemetry check-in.</p>
        </div>

        {/* Main Venue Card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">The Tabernacle, Atlanta</div>
              <h2 className="text-xl font-semibold">{booking.venue_name}</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              booking.status === 'arrived' || booking.status === 'completed'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              ● {booking.status === 'arrived' ? 'ARRIVED & VERIFIED' : booking.status.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-neutral-400">{booking.event_address}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Date & Time</div>
            <div className="text-base font-medium">
              {new Date(booking.scheduled_at).toLocaleDateString()} at{' '}
              {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Escrow Status</div>
            <div className="text-base font-semibold text-emerald-400 uppercase">
              {booking.payout_status === 'released' ? 'Released' : 'Secured in Escrow'}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Creator Payout</div>
            <div className="text-base font-semibold">${booking.creator_payout}</div>
          </div>
        </div>

        {/* Host Action: Release Escrow Payout */}
        {booking.payout_status !== 'released' ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold mb-1">Ready to disburse funds?</h3>
              <p className="text-xs text-neutral-400">Release the escrow payout directly to the creator's connected account.</p>
            </div>
            <button
              onClick={handleReleaseEscrow}
              disabled={releasing}
              className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {releasing ? 'Releasing...' : 'Release Escrow Payout'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-900 bg-emerald-950/30 p-6 text-center">
            <p className="text-sm text-emerald-400 font-medium">✓ Escrow funds have been successfully released to the creator.</p>
          </div>
        )}
      </div>
    </div>
  )
}