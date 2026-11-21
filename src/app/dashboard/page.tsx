'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Booking {
  id: string
  venue_name: string
  venue_address: string
  escrow_payout: number
  payout_status: string
  arrival_verified: boolean
  talent_name: string
  scheduled_time: string
}

export default function TelemetryDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  // Fetch bookings data (mocked or from your backend telemetry API)
  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const res = await fetch('/api/telemetry') // Adjust endpoint if needed
        const data = await res.json()
        if (data.bookings) {
          setBookings(data.bookings)
        } else {
          // Fallback mock data matching your active UI screenshot state
          setBookings([
            {
              id: '11111111-1111-1111-1111-111111111111',
              venue_name: 'The Tabernacle, Atlanta',
              venue_address: '152 Luckie St NW, Atlanta, GA 30303',
              escrow_payout: 475,
              payout_status: 'ESCROW_HELD',
              arrival_verified: true,
              talent_name: 'Test Creator',
              scheduled_time: 'Today, 7:00 PM'
            }
          ])
        }
      } catch (err) {
        console.error('Failed to load telemetry feed', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTelemetry()
  }, [])

  // Handle Stripe Connect Express Onboarding redirect
  async function handleConnectPayouts() {
    try {
      setConnecting(true)
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start payout onboarding')
      window.location.href = data.url
    } catch (err: any) {
      alert(err.message)
      setConnecting(false)
    }
  }

  const verifiedCount = bookings.filter((b) => b.arrival_verified).length
  const pendingCount = bookings.filter((b) => !b.arrival_verified).length

  return (
    <div className="min-h-screen bg-black text-white px-6 py-8">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-800 pb-6 mb-8 gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
            ⚡ LIVE TELEMETRY FEED
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PULL UP Operations Board</h1>
        </div>

        {/* Action Controls & Metric Badges */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleConnectPayouts}
            disabled={connecting}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {connecting ? 'Redirecting to Stripe...' : 'Set Up Creator Payouts'}
          </button>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-right">
              <div className="text-xs text-neutral-400">VERIFIED ON-SITE</div>
              <div className="text-lg font-bold text-emerald-400">{verifiedCount} Bookings</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-right">
              <div className="text-xs text-neutral-400">EN ROUTE / PENDING</div>
              <div className="text-lg font-bold text-amber-400">{pendingCount} Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed Content */}
      {loading ? (
        <div className="text-neutral-500 py-12 text-center">Loading telemetry feed...</div>
      ) : bookings.length === 0 ? (
        <div className="text-neutral-500 py-12 text-center">No active bookings found in telemetry.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-neutral-400">#{booking.id.slice(0, 8)}</span>
                  {booking.arrival_verified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      VERIFIED
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-1 text-white">{booking.venue_name}</h3>
                <p className="text-sm text-neutral-400 mb-6">{booking.venue_address}</p>

                <div className="border-t border-neutral-900 pt-4 mb-6 flex justify-between items-center text-sm">
                  <div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Escrow Payout</div>
                    <div className="text-lg font-semibold text-white">${booking.escrow_payout}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider">Payout State</div>
                    <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">{booking.payout_status}</div>
                  </div>
                </div>
              </div>

              <Link
                href={`/dashboard/booking/${booking.id}`}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 py-3 text-center text-sm font-medium text-white hover:bg-neutral-800 transition block"
              >
                View Booking Control Panel
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}