import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import HostBookingCard from '@/components/HostBookingCard'
import { CheckInButton } from '@/components/CheckInButton' // Or your existing creator check-in component

interface BookingPageProps {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: BookingPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (bookingError || !booking) {
    notFound()
  }

  const isBuyer = booking.buyer_id === user.id
  const isCreator = booking.creator_id === user.id

  if (!isBuyer && !isCreator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-neutral-400">You are not authorized to view this booking.</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-xl space-y-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Appearance Dashboard
          </span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Booking #{booking.id.slice(0, 8)}</h1>
        </div>

        {/* Render Host Control Panel if user is the buyer/host */}
        {isBuyer && <HostBookingCard booking={booking} />}

        {/* Render Creator Check-In View if user is the creator */}
        {isCreator && (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
            <h3 className="text-lg font-bold">Creator Telemetry & Check-In</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Venue: {booking.venue_name || booking.event_address}
            </p>
            <div className="mt-6">
              <CheckInButton bookingId={booking.id} creatorId={user.id} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}