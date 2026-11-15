import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Server misconfiguration: STRIPE_SECRET_KEY is missing.' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28' as any,
    })

    const supabase = await createClient()

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

    let user = null
    if (token) {
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    }
    if (!user) {
      const { data } = await supabase.auth.getUser()
      user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: No active user session found.' }, { status: 401 })
    }

    const body = await request.json()
    const {
      creatorId,
      venueName,
      eventAddress,
      venueLat,
      venueLng,
      scheduledAt,
      creatorPayout,
    } = body

    if (!creatorId || !venueName || !eventAddress || !creatorPayout) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 })
    }

    const payoutAmount = Number(creatorPayout)
    const platformFee = Math.round(payoutAmount * 0.15 * 100) / 100
    const totalAmount = payoutAmount + platformFee
    const handshakePin = Math.floor(1000 + Math.random() * 9000).toString()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `PULL UP Appearance — ${venueName}`,
              description: `Escrow-protected creator appearance at ${eventAddress}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        buyer_id: user.id,
        creator_id: creatorId,
        venue_name: venueName,
        event_address: eventAddress,
        venue_lat: String(venueLat || ''),
        venue_lng: String(venueLng || ''),
        scheduled_at: scheduledAt || new Date().toISOString(),
        creator_payout: String(payoutAmount),
        platform_fee: String(platformFee),
        total_amount: String(totalAmount),
        handshake_pin: handshakePin,
      },
      success_url: `${appUrl}/dashboard/telemetry?checkout=success`,
      cancel_url: `${appUrl}/dashboard/book?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout session error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}