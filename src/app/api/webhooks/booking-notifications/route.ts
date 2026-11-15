import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Server misconfiguration: Missing Supabase environment variables.' },
        { status: 500 }
      )
    }

    // Verify webhook secret header
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const payload = await request.json()
    const record = payload.record
    const oldRecord = payload.old_record

    if (!record) {
      return NextResponse.json({ error: 'No booking record in payload' }, { status: 400 })
    }

    // Fetch buyer and creator contact details
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', [record.buyer_id, record.creator_id])

    const buyer = profiles?.find((p) => p.id === record.buyer_id)
    const creator = profiles?.find((p) => p.id === record.creator_id)

    let messageBody: string | null = null
    let recipientPhone: string | null = null

    // 1. New booking confirmed (INSERT)
    if (payload.type === 'INSERT' && record.status === 'confirmed') {
      recipientPhone = creator?.phone || null
      messageBody = `PULL UP: New confirmed booking at ${record.venue_name} (${record.event_address}). Payout: $${record.creator_payout}.`
    }

    // 2. Creator arrived / checked in (UPDATE)
    if (
      payload.type === 'UPDATE' &&
      oldRecord?.status !== 'arrived' &&
      record.status === 'arrived'
    ) {
      recipientPhone = buyer?.phone || null
      messageBody = `PULL UP: ${creator?.full_name || 'Your creator'} has arrived at ${record.venue_name}.`
    }

    // 3. Escrow released (UPDATE)
    if (
      payload.type === 'UPDATE' &&
      oldRecord?.payout_status !== 'released' &&
      record.payout_status === 'released'
    ) {
      recipientPhone = creator?.phone || null
      messageBody = `PULL UP: Escrow of $${record.creator_payout} has been released for ${record.venue_name}!`
    }

    // Send SMS via Twilio if configured and phone/message exist
    if (
      messageBody &&
      recipientPhone &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
      const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64')

      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: recipientPhone,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: messageBody,
        }),
      })
    }

    return NextResponse.json({ received: true, notified: Boolean(messageBody && recipientPhone) })
  } catch (err: any) {
    console.error('Booking notification webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}