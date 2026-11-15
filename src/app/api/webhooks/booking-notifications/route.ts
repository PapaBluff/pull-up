import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use Service Role key so webhook bypasses RLS to read phone numbers & write notifications
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendSMS(to: string | null | undefined, body: string) {
  if (!to) {
    console.log(`[SMS Skipped - No Phone Number]: ${body}`)
    return
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  // Safe mock fallback when Twilio credentials are not yet set in .env.local
  if (!accountSid || !authToken || !fromNumber) {
    console.log(`\n📲 [MOCK SMS TO ${to}]: ${body}\n`)
    return
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const params = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Twilio SMS error:', errText)
  }
}

export async function POST(request: Request) {
  try {
    // Optional security check using a shared secret header from Supabase Webhook
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET
    if (webhookSecret) {
      const authHeader = request.headers.get('x-webhook-secret')
      if (authHeader !== webhookSecret) {
        return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
      }
    }

    const payload = await request.json()
    const { type, record, old_record } = payload

    if (type !== 'UPDATE' || !record || !old_record) {
      return NextResponse.json({ ignored: true })
    }

    const venueName = record.venue_name || 'the venue'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const bookingLink = `${appUrl}/dashboard/booking/${record.id}`

    // EVENT 1: Creator arrival just became verified -> Notify Buyer/Host
    if (old_record.arrival_status !== 'verified' && record.arrival_status === 'verified') {
      const { data: buyer } = await supabaseAdmin
        .from('profiles')
        .select('phone_number')
        .eq('id', record.buyer_id)
        .single()

      const smsMessage = `PULL UP: Your creator has arrived and passed telemetry verification at ${venueName}. Confirm appearance & release escrow here: ${bookingLink}`

      await Promise.all([
        sendSMS(buyer?.phone_number, smsMessage),
        supabaseAdmin.from('notifications').insert({
          user_id: record.buyer_id,
          booking_id: record.id,
          title: 'Creator Verified On-Site',
          message: `Arrival verified at ${venueName}. Ready to release escrow payout.`,
          type: 'arrival_verified',
        }),
      ])
    }

    // EVENT 2: Host released escrow payout -> Notify Creator
    if (old_record.payout_status !== 'released' && record.payout_status === 'released') {
      const { data: creator } = await supabaseAdmin
        .from('profiles')
        .select('phone_number')
        .eq('id', record.creator_id)
        .single()

      const payoutFormatted = Number(record.creator_payout || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })

      const smsMessage = `PULL UP: Host confirmed your appearance at ${venueName}! ${payoutFormatted} has been released to your Stripe account.`

      await Promise.all([
        sendSMS(creator?.phone_number, smsMessage),
        supabaseAdmin.from('notifications').insert({
          user_id: record.creator_id,
          booking_id: record.id,
          title: 'Escrow Payout Released',
          message: `${payoutFormatted} has been transferred for ${venueName}.`,
          type: 'payout_released',
        }),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Notification webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}