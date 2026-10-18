'use client'

import { useState } from 'react'
import Link from 'next/link'
import HandshakeCard from '@/components/HandshakeCard'
import { DollarSign, Clock, CheckCircle2, MapPin, ArrowUpRight, ShieldCheck } from 'lucide-react'

export default function DashboardPage() {
  const [activeBooking, setActiveBooking] = useState({
    id: 'bk_8832',
    buyerName: 'Red Bull Event Co.',
    eventAddress: '100 Peachtree St NW, Atlanta, GA 30303',
    date: 'Today at 7:00 PM',
    amount: 300,
    status: 'escrow_held',
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-lg font-black tracking-wider flex items-center space-x-1">
            <span className="text-emerald-400">PULL</span>
            <span className="text-zinc-500">/</span>
            <span>UP</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-normal ml-2">DASHBOARD</span>
          </Link>
          
          <Link
            href="/alex"
            target="_blank"
            className="text-xs bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 px-3.5 py-1.5 rounded-lg flex items-center space-x-1 transition-all"
          >
            <span>View Public Bio Link</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Creator Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Funds In Escrow</span>
            <div className="text-3xl font-black mt-2 text-emerald-400 font-mono">$300.00</div>
            <p className="text-[11px] text-zinc-500 mt-1">Locked & ready for physical verification</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Completed Appearances</span>
            <div className="text-3xl font-black mt-2 font-mono">14</div>
            <p className="text-[11px] text-zinc-500 mt-1">100% payout completion rate</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Hourly Rate</span>
            <div className="text-3xl font-black mt-2 font-mono">$150/hr</div>
            <p className="text-[11px] text-zinc-500 mt-1">Configured in profile settings</p>
          </div>
        </div>

        {/* Active Booking Telemetry & Handshake Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>Active Appearance Booking</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Booking Details Card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-zinc-500">ID: {activeBooking.id}</span>
                  <span className="inline-flex items-center space-x-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Escrow Funds Held</span>
                  </span>
                </div>

                <h3 className="text-xl font-bold">{activeBooking.buyerName}</h3>
                
                <div className="space-y-2 mt-4 text-xs text-zinc-400">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>{activeBooking.eventAddress}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>{activeBooking.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="text-zinc-200 font-semibold">${activeBooking.amount}.00 Escrow Payout</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg text-xs text-zinc-400">
                <p>
                  <strong className="text-zinc-200">How to claim payout:</strong> When you arrive at the venue, open the physical handshake card on the right, allow browser location access, enter the client's 4-digit PIN, and tap verify.
                </p>
              </div>
            </div>

            {/* Verification Telemetry Handshake Component */}
            <div>
              <HandshakeCard
                bookingId={activeBooking.id}
                actorId="usr_creator_123"
                eventAddress={activeBooking.eventAddress}
              />
            </div>

          </div>
        </div>

      </main>

    </div>
  )
}