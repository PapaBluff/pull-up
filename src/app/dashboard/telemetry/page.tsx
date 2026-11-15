'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, ShieldCheck, Clock, AlertCircle, Radio, UserCheck } from 'lucide-react'

interface BookingTelemetry {
  id: string
  venue_name: string
  event_address: string
  arrival_status: string
  payout_status: string
  creator_payout: number
  scheduled_at: string
  creator_id: string
  buyer_id: string
}

export default function LiveTelemetryBoard() {
  const [bookings, setBookings] = useState<BookingTelemetry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 1. Fetch initial active bookings
    async function fetchBookings() {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('scheduled_at', { ascending: true })

      if (!error && data) {
        setBookings(data)
      }
      setLoading(false)
    }

    fetchBookings()

    // 2. Subscribe to live changes across all bookings
    const channel = supabase
      .channel('live-telemetry-board')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookings((prev) => [payload.new as BookingTelemetry, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setBookings((prev) =>
              prev.map((b) => (b.id === payload.new.id ? (payload.new as BookingTelemetry) : b))
            )
          } else if (payload.eventType === 'DELETE') {
            setBookings((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const verifiedCount = bookings.filter((b) => b.arrival_status === 'verified').length
  const pendingCount = bookings.filter((b) => b.arrival_status !== 'verified').length

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header & Metrics */}
        <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Radio className="h-5 w-5 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest">Live Telemetry Feed</span>
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight">PULL UP Operations Board</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-2.5">
              <div className="text-[10px] font-semibold uppercase text-neutral-500">Verified On-Site</div>
              <div className="text-lg font-bold text-emerald-400">{verifiedCount} Bookings</div>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-2.5">
              <div className="text-[10px] font-semibold uppercase text-neutral-500">En Route / Pending</div>
              <div className="text-lg font-bold text-amber-400">{pendingCount} Bookings</div>
            </div>
          </div>
        </div>

        {/* Telemetry Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-500">Loading live telemetry streams...</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-12 text-center text-neutral-400">
            No active bookings found in the telemetry database.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              const isVerified = booking.arrival_status === 'verified'
              const isPaid = booking.payout_status === 'released'

              return (
                <div
                  key={booking.id}
                  className={`flex flex-col justify-between rounded-3xl border p-6 transition-all ${
                    isVerified
                      ? 'border-emerald-900/40 bg-neutral-950'
                      : 'border-neutral-800 bg-neutral-950'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-neutral-500">#{booking.id.slice(0, 8)}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                          isVerified
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" /> Verified
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5" /> Pending
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-white">{booking.venue_name || 'Private Venue'}</h3>
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-neutral-400">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
                      {booking.event_address || 'Geofenced Location'}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-neutral-900 pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Escrow Payout</span>
                      <span className="font-mono font-bold text-white">
                        ${Number(booking.creator_payout || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Payout State</span>
                      <span
                        className={`font-semibold uppercase ${
                          isPaid ? 'text-emerald-400' : 'text-neutral-400'
                        }`}
                      >
                        {booking.payout_status}
                      </span>
                    </div>

                    <a
                      href={`/dashboard/booking/${booking.id}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-black py-2.5 text-xs font-bold text-white transition-colors hover:bg-neutral-900"
                    >
                      View Booking Control Panel
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}