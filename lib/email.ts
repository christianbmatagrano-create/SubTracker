import { Resend } from 'resend'
import { formatCurrency } from './billing'
import type { Subscription } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReminderEmail({
  toEmail,
  subscription,
  daysUntilBilling,
}: {
  toEmail: string
  subscription: Subscription
  daysUntilBilling: number
}) {
  const urgency =
    daysUntilBilling <= 1 ? 'tomorrow' :
    daysUntilBilling <= 3 ? `in ${daysUntilBilling} days` :
    `in ${daysUntilBilling} days`

  const subject =
    daysUntilBilling <= 1
      ? `${subscription.name} bills tomorrow — ${formatCurrency(subscription.amount, subscription.currency)}`
      : `${subscription.name} bills ${urgency} — heads up`

  const billingDate = new Date(subscription.next_billing_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1e2a6e;padding:28px 36px;">
            <p style="margin:0;color:#a8b4f8;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">SubTracker</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:600;line-height:1.3;">Billing reminder</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
              Your <strong>${subscription.name}</strong> subscription bills <strong>${urgency}</strong>.
            </p>
            <!-- Sub detail card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;">Service</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:500;">${subscription.name}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:13px;">Amount</td>
                      <td style="padding:6px 0;color:#111827;font-size:15px;font-weight:700;">${formatCurrency(subscription.amount, subscription.currency)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:13px;">Billing date</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:500;">${billingDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:13px;">Cycle</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:500;">${subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)}</td>
                    </tr>
                    ${subscription.notes ? `
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:13px;">Notes</td>
                      <td style="padding:6px 0;color:#111827;font-size:13px;">${subscription.notes}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
              Make sure you have funds available or cancel before the billing date if you no longer need this subscription.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Sent by SubTracker · You're receiving this because you set up reminders for this subscription.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: toEmail,
    subject,
    html,
  })
}
