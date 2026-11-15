import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28' as any,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata

    if (meta?.buyer_id && meta?.creator_id) {
      const { error } = await supabaseAdmin.from('bookings').upsert(
        {
          stripe_session_id: session.id,
          buyer_id: meta.buyer_id,
          creator_id: meta.creator_id,
          venue_name: meta.venue_name,
          event_address: meta.event_address,
          venue_lat: meta.venue_lat ? Number(meta.venue_lat) : null,
          venue_lng: meta.venue_lng ? Number(meta.venue_lng) : null,
          scheduled_at: meta.scheduled_at,
          creator_payout: Number(meta.creator_payout),
          platform_fee: Number(meta.platform_fee),
          total_amount: Number(meta.total_amount),
          handshake_pin: meta.handshake_pin,
          arrival_status: 'pending',
          payout_status: 'escrow_held',
          status: 'confirmed',
        },
        { onConflict: 'stripe_session_id' }
      )

      if (error) {
        console.error('Failed to insert booking from Stripe webhook:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}