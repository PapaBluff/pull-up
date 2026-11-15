'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface CheckInButtonProps {
  bookingId: string
  creatorId: string
  venueName: string
  initialStatus?: string
}

export default function CheckInButton({
  bookingId,
  creatorId,
  venueName,
  initialStatus = 'pending',
}: CheckInButtonProps) {
  const [status, setStatus] = useState<string>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const supabase = createClient()

  // Supabase Realtime Listener to sync status changes across clients/dashboards
  useEffect(() => {
    const channel = supabase
      .channel(`booking-realtime-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload.new)
          if (payload.new.arrival_status) {
            setStatus(payload.new.arrival_status)
            if (payload.new.arrival_status === 'verified') {
              setShowOtpModal(false)
              setMessage('Arrival verified successfully via Realtime sync!')
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId, supabase])

  const executeCheckIn = async (codeToSubmit?: string) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setLoading(true)
    setMessage('Acquiring precise GPS telemetry...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const accuracy = position.coords.accuracy

          setMessage(`GPS locked (Accuracy: ${Math.round(accuracy)}m). Validating arrival...`)

          const res = await fetch('/api/bookings/verify-arrival', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              creatorId,
              lat,
              lng,
              accuracy,
              otp: codeToSubmit || null,
            }),
          })

          const data = await res.json()

          if (data.success) {
            setStatus('verified')
            setMessage(data.message)
            setShowOtpModal(false)
          } else {
            // Automatically reveal the OTP fallback box on any telemetry/distance rejection
            setShowOtpModal(true)
            setMessage(data.message || 'GPS validation failed. Please use the venue check-in code.')
          }
        } catch (err: any) {
          setShowOtpModal(true)
          setMessage(err.message || 'Verification failed.')
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setLoading(false)
        setShowOtpModal(true)
        setMessage(`Location error: ${error.message}. Ensure location permissions are enabled or use your check-in code.`)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            <MapPin className="h-4 w-4 text-white" /> {venueName}
          </div>
          <h3 className="mt-1 text-xl font-bold text-white">Verified Arrival</h3>
        </div>

        {status === 'verified' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> ARRIVED & VERIFIED
          </span>
        ) : (
          <button
            onClick={() => executeCheckIn()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-all hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            I HAVE ARRIVED
          </button>
        )}
      </div>

      {message && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-xs font-medium text-neutral-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{message}</span>
        </div>
      )}

      {showOtpModal && status !== 'verified' && (
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-5">
          <h4 className="text-sm font-bold uppercase tracking-tight text-white">
            Secondary Verification Required
          </h4>
          <p className="mt-1 text-xs text-neutral-400">
            GPS signal was obstructed or outside strict radius. Enter the one-time check-in code provided by the host.
          </p>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              placeholder="Enter check-in code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
            <button
              onClick={() => executeCheckIn(otpCode)}
              disabled={loading || !otpCode}
              className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black transition-all hover:bg-neutral-200 disabled:opacity-50"
            >
              Verify Code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}