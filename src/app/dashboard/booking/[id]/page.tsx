import { createClient } from '@/lib/supabase/server'
import CheckInButton from '../../../../components/CheckInButton'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, User } from 'lucide-react'

interface BookingPageProps {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: BookingPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the specific booking and explicit buyer/creator profile details from Supabase
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, buyer:profiles!buyer_id(*), creator:profiles!creator_id(*)')
    .eq('id', id)
    .single()

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold">Booking not found</h1>
        <p className="mt-2 text-sm text-neutral-400">This booking may not exist or has been removed.</p>
        <Link href="/" className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-all hover:bg-neutral-200">
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="border-b border-neutral-800 bg-black/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-xl font-black uppercase tracking-tight text-white">PULL UP</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Booking #{booking.id.slice(0, 8)}
          </span>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">Appearance Details</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Scheduled venue arrival and telemetry check-in.
          </p>
        </div>

        <div className="space-y-6">
          {/* Main Verified Arrival Component */}
          <CheckInButton
            bookingId={booking.id}
            creatorId={booking.creator_id}
            venueName={booking.venue_name || 'Event Venue Location'}
            initialStatus={booking.arrival_status}
          />

          {/* Booking Summary Meta Card */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase">
                <Calendar className="h-4 w-4 text-white" /> Date & Time
              </div>
              <p className="mt-2 text-lg font-bold text-white">
                {booking.scheduled_date || 'Today, 7:00 PM'}
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase">
                <DollarSign className="h-4 w-4 text-white" /> Escrow Status
              </div>
              <p className="mt-2 text-lg font-bold text-emerald-400 uppercase">
                {booking.escrow_status || 'Secured in Escrow'}
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase">
                <User className="h-4 w-4 text-white" /> Talent Assigned
              </div>
              <p className="mt-2 text-lg font-bold text-white">
                {booking.creator?.full_name || 'Creator Talent'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}