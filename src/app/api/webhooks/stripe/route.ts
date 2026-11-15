import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: Request) {
  try {
    if (
      !process.env.STRIPE_SECRET_KEY ||
      !process.env.STRIPE_WEBHOOK_SECRET ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Server misconfiguration: Missing webhook or Supabase environment variables.' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28' as any,
    })

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed:', err.message)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata || {}

      const { error: insertError } = await supabaseAdmin.from('bookings').insert({
        buyer_id: metadata.buyer_id,
        creator_id: metadata.creator_id,
        venue_name: metadata.venue_name,
        event_address: metadata.event_address,
        venue_lat: metadata.venue_lat ? Number(metadata.venue_lat) : null,
        venue_lng: metadata.venue_lng ? Number(metadata.venue_lng) : null,
        scheduled_at: metadata.scheduled_at,
        creator_payout: Number(metadata.creator_payout || 0),
        platform_fee: Number(metadata.platform_fee || 0),
        total_amount: Number(metadata.total_amount || 0),
        handshake_pin: metadata.handshake_pin,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        status: 'confirmed',
        payout_status: 'escrowed',
      })

      if (insertError) {
        console.error('Failed to insert booking from Stripe webhook:', insertError)
        return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Stripe webhook handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}