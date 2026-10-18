'use client'

import { useState } from 'react'
import { MapPin, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface HandshakeProps {
  bookingId: string
  actorId: string
  eventAddress: string
}

export default function HandshakeCard({ bookingId, actorId, eventAddress }: HandshakeProps) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null)

  const handleVerify = () => {
    if (pin.length !== 4) {
      setStatus({ success: false, message: 'Please enter a valid 4-digit PIN.' })
      return
    }

    setLoading(true)
    setStatus(null)

    // Grab live browser GPS location
    if (!navigator.geolocation) {
      setStatus({ success: false, message: 'Geolocation is not supported by your browser.' })
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/bookings/verify-arrival', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              actorId,
              deviceLat: position.coords.latitude,
              deviceLng: position.coords.longitude,
              pinInput: pin,
            }),
          })

          const data = await res.json()

          if (res.ok && data.success) {
            setStatus({ success: true, message: data.message })
          } else {
            setStatus({ success: false, message: data.error || 'Verification failed.' })
          }
        } catch (err: any) {
          setStatus({ success: false, message: 'Network error. Try again.' })
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setStatus({ success: false, message: 'Unable to retrieve GPS coordinates. Allow location access.' })
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="w-full max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl text-white">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Physical Handshake</h3>
          <p className="text-xs text-zinc-400">{eventAddress}</p>
        </div>
      </div>

      <div className="space-y-4 my-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
            Enter Handshake 4-Digit PIN
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {status && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
              status.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {status.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || pin.length !== 4}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold rounded-lg flex items-center justify-center space-x-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying Telemetry...</span>
            </>
          ) : (
            <span>Verify Arrival & Release Payout</span>
          )}
        </button>
      </div>

      <p className="text-[10px] text-zinc-500 text-center">
        Requires device GPS access. Verified against 300-ft perimeter geofence.
      </p>
    </div>
  )
}