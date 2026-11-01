import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { amount, creatorStripeAccountId, bookingId } = await req.json()

    // Calculate Platform Fee (20%) and Creator Payout (80%)
    const platformFee = Math.round(amount * 0.20 * 100) // 20% in cents
    const totalAmountCents = Math.round(amount * 100)   // Total in cents

    // Create PaymentIntent with manual capture (Escrow Hold)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: 'usd',
      capture_method: 'manual', // Holds money on card for up to 7 days
      application_fee_amount: platformFee,
      transfer_data: {
        destination: creatorStripeAccountId, // Target Creator's connected Stripe account
      },
      metadata: {
        bookingId: bookingId,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}