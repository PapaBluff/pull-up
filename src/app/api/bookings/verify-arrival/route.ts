import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { calculateDistanceInFeet, GEOFENCE_THRESHOLD_FEET } from '@/lib/telemetry'

export async function POST(req: Request) {
  try {
    const { bookingId, actorId, deviceLat, deviceLng, pinInput } = await req.json()
    const supabase = createClient()

    // 1. Fetch booking details from Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // 2. Calculate GPS Distance in Feet
    const distanceFeet = calculateDistanceInFeet(
      deviceLat,
      deviceLng,
      booking.event_lat,
      booking.event_lng
    )

    const geofencePassed = distanceFeet <= GEOFENCE_THRESHOLD_FEET
    const pinVerified = pinInput === booking.pin_code

    // 3. Record Telemetry Log for Audit/Dispute Protection
    await supabase.from('telemetry_logs').insert({
      booking_id: bookingId,
      actor_id: actorId,
      device_lat: deviceLat,
      device_lng: deviceLng,
      distance_feet: distanceFeet,
      geofence_passed: geofencePassed,
      pin_verified: pinVerified,
    })

    // 4. Verification Check
    if (!geofencePassed) {
      return NextResponse.json(
        {
          success: false,
          error: `Geofence check failed. You are ${distanceFeet} feet away (Must be within 300 ft).`,
          distanceFeet,
        },
        { status: 400 }
      )
    }

    if (!pinVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid 4-digit PIN handshake code.',
          distanceFeet,
        },
        { status: 400 }
      )
    }

    // 5. Release Stripe Escrow Hold to Creator
    if (booking.stripe_payment_intent_id) {
      await stripe.paymentIntents.capture(booking.stripe_payment_intent_id)
    }

    // 6. Update Booking Status to Completed
    await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId)

    return NextResponse.json({
      success: true,
      message: 'Physical arrival verified & escrow payment released to creator.',
      distanceFeet,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}