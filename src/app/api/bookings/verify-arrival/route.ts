import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bookingId, creatorId, lat, lng, accuracy, otp } = body

    // Validate required fields
    if (!bookingId || !creatorId || lat === undefined || lng === undefined || accuracy === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required location or booking parameters.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Call the Supabase PostGIS stored procedure via RPC
    const { data, error } = await supabase.rpc('verify_creator_arrival', {
      p_booking_id: bookingId,
      p_creator_id: creatorId,
      p_lat: Number(lat),
      p_lng: Number(lng),
      p_accuracy: Number(accuracy),
      p_provided_otp: otp || null,
    })

    if (error) {
      console.error('Supabase RPC Error:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}