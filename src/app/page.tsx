'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, MapPin, KeyRound, Lock, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const [handle, setHandle] = useState('')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-zinc-950">
      
      {/* Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto p-6 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center space-x-2 font-mono text-xl font-black tracking-wider">
          <span className="text-emerald-400">PULL</span>
          <span className="text-zinc-400">/</span>
          <span>UP</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/alex"
            className="text-xs uppercase font-semibold bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 px-4 py-2 rounded-lg transition-all text-emerald-400"
          >
            Demo Page
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-4xl mx-auto px-6 py-16 text-center space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Verified Physical Appearances & Escrow Protection</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          No More DM Ghosting.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Guaranteed Payouts for Real-World Appearances.
          </span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Pull Up locks booking funds in neutral escrow before creators travel. Funds automatically release upon physical GPS arrival and a 4-digit PIN handshake.
        </p>

        {/* Claim Handle Bar */}
        <div className="max-w-md mx-auto pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (handle) window.location.href = `/${handle}`
            }}
            className="flex items-center bg-zinc-900 border border-zinc-800 focus-within:border-emerald-500 rounded-xl p-2 shadow-2xl transition-all"
          >
            <span className="text-zinc-500 pl-3 font-mono text-sm select-none">pullup.app/</span>
            <input
              type="text"
              placeholder="yourhandle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full bg-transparent border-none text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm font-mono px-1"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 shrink-0 transition-all"
            >
              <span>Claim</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 3-Step Mechanics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-16 text-left">
          
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">1. Escrow Lock</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Clients pay upfront. Payment is pre-authorized and held safely in Stripe Escrow before the event starts.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">2. 300-ft Geofence</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Creator arrives at the venue. Device telemetry confirms physical location within a 300-foot perimeter.
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">3. PIN Handshake</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Client provides the 4-digit PIN. Instant verification releases funds directly to the creator's bank account.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto p-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <p className="font-mono">PULL UP © 2026 • Infrastructure for Physical Appearances</p>
        <div className="flex space-x-4">
          <Link href="/alex" className="hover:text-zinc-300 transition-colors">Test Booking</Link>
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Creator Portal</Link>
        </div>
      </footer>

    </div>
  )
}
