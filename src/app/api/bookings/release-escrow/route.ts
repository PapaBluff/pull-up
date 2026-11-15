import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28' as any,
})

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await request.json()
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, creator:profiles!bookings_creator_id_fkey(stripe_account_id)')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can release escrow' }, { status: 403 })
    }

    if (booking.payout_status === 'released') {
      return NextResponse.json({ error: 'Escrow already released' }, { status: 400 })
    }

    const creatorStripeAccount = booking.creator?.stripe_account_id
    let transferId = null

    if (creatorStripeAccount) {
      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(booking.creator_payout) * 100),
        currency: 'usd',
        destination: creatorStripeAccount,
        transfer_group: booking.id,
        metadata: {
          booking_id: booking.id,
          creator_id: booking.creator_id,
        },
      })
      transferId = transfer.id
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payout_status: 'released',
        status: 'completed',
        stripe_transfer_id: transferId,
        released_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      transferId,
      message: 'Escrow funds released successfully.',
    })
  } catch (err: any) {
    console.error('Release escrow error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}