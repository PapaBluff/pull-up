'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, DollarSign, Clock, CheckCircle2, Loader2, KeyRound } from 'lucide-react'

interface HostBookingCardProps {
  booking: {
    id: string
    venue_name: string
    pin_code: string
    arrival_status: string
    host_confirmed: boolean
    payout_status: string
    creator_payout: number
  }
}

export default function HostBookingCard({ booking: initialBooking }: HostBookingCardProps) {
  const [booking, setBooking] = useState(initialBooking)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`host-booking-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`,
        },
        (payload) => {
          setBooking((prev) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [booking.id, supabase])

  const handleReleasePayout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings/release-escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message)
      } else {
        setBooking((prev) => ({
          ...prev,
          host_confirmed: true,
          payout_status: 'released',
        }))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm payout.')
    } finally {
      setLoading(false)
    }
  }

  const isArrived = booking.arrival_status === 'verified'
  const isPaid = booking.payout_status === 'released'
  const formattedAmount = Number(booking.creator_payout || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Host Control Panel
          </span>
          <h3 className="mt-1 text-xl font-bold text-white">{booking.venue_name}</h3>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-neutral-800 bg-black px-4 py-2.5">
          <KeyRound className="h-4 w-4 text-neutral-400" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Fallback OTP
            </div>
            <div className="font-mono text-sm font-bold tracking-widest text-white">
              {booking.pin_code || '----'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-black p-4">
          <div className="text-xs font-medium text-neutral-400">Creator Telemetry</div>
          <div className="mt-1.5 flex items-center gap-2">
            {isArrived ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Verified On-Site
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-400">
                <Clock className="h-4 w-4" /> En Route / Pending
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-black p-4">
          <div className="text-xs font-medium text-neutral-400">Escrow Payout</div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-sm font-bold text-white">{formattedAmount}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                isPaid
                  ? 'border border-emerald-800 bg-emerald-950 text-emerald-400'
                  : 'border border-neutral-700 bg-neutral-900 text-neutral-300'
              }`}
            >
              {isPaid ? 'Released' : 'Held'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-xs font-medium text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6">
        {isPaid ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-800/60 bg-emerald-950/30 py-3.5 text-sm font-bold text-emerald-400">
            <ShieldCheck className="h-5 w-5" /> Appearance Confirmed & Funds Released
          </div>
        ) : (
          <button
            onClick={handleReleasePayout}
            disabled={!isArrived || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black transition-all hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4" />
            )}
            {isArrived
              ? `Confirm Appearance & Release ${formattedAmount}`
              : 'Waiting for Creator Arrival Verification'}
          </button>
        )}
      </div>
    </div>
  )
}