import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendReminderEmail } from '@/lib/email'

// Vercel cron hits this endpoint daily at 9am UTC
// Secured by CRON_SECRET header (set in vercel.json or via Vercel env)
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find all active subscriptions
  const { data: subs, error: subError } = await supabase
    .from('subscriptions')
    .select('*, profiles!subscriptions_user_id_fkey(reminder_email)')
    .eq('is_active', true)

  if (subError) {
    console.error('Cron: failed to fetch subscriptions', subError)
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const sub of (subs ?? [])) {
    const billingDate = new Date(sub.next_billing_date)
    billingDate.setHours(0, 0, 0, 0)
    const daysUntilBilling = Math.round((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Check if this is a reminder day for this subscription
    if (!sub.reminder_days.includes(daysUntilBilling)) continue

    // Check if we already sent this reminder
    const { data: existingLog } = await supabase
      .from('reminder_log')
      .select('id')
      .eq('subscription_id', sub.id)
      .eq('days_before', daysUntilBilling)
      .eq('billing_date', sub.next_billing_date)
      .single()

    if (existingLog) {
      skipped++
      continue
    }

    // Get reminder email (falls back to account email)
    const reminderEmail = (sub as any).profiles?.reminder_email
    if (!reminderEmail) {
      errors.push(`No email for subscription ${sub.id}`)
      continue
    }

    try {
      await sendReminderEmail({
        toEmail: reminderEmail,
        subscription: sub,
        daysUntilBilling,
      })

      // Log the send to prevent duplicates
      await supabase.from('reminder_log').insert({
        subscription_id: sub.id,
        days_before: daysUntilBilling,
        billing_date: sub.next_billing_date,
      })

      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Failed to send for ${sub.name}: ${msg}`)
      console.error('Cron: email send failed', { sub: sub.id, err })
    }
  }

  console.log(`Cron complete: ${sent} sent, ${skipped} skipped, ${errors.length} errors`)
  return NextResponse.json({ sent, skipped, errors })
}
