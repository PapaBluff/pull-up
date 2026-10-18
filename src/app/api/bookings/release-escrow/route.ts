import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { paymentIntentId } = await req.json()

    // Capture the escrow hold and release money to creator
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId)

    return NextResponse.json({
      status: 'success',
      captured: paymentIntent.status === 'succeeded',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}