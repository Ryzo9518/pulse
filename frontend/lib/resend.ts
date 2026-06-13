import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const { data, error } = await resend.emails.send({
    from: from || 'PULSE <noreply@jera.co.za>',
    to,
    subject,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

// Pre-built email templates
export function pingEmailHtml(fromName: string, toName: string) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="background: #911431; border-radius: 12px 12px 0 0; padding: 24px 28px;">
        <h1 style="color: #fff; font-size: 20px; margin: 0;">PULSE Reminder</h1>
      </div>
      <div style="background: #fff; border: 1px solid #E8E4DF; border-top: none; border-radius: 0 0 12px 12px; padding: 28px;">
        <p style="font-size: 15px; color: #1a1a1a; line-height: 1.6;">
          Hi ${toName},
        </p>
        <p style="font-size: 15px; color: #6B645C; line-height: 1.6;">
          <strong>${fromName}</strong> has sent you a reminder to review your pending tasks on PULSE.
        </p>
        <p style="font-size: 15px; color: #6B645C; line-height: 1.6;">
          Please log in and check your dashboard for any outstanding items.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background: #911431; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px;">
          Open PULSE →
        </a>
      </div>
      <p style="font-size: 11px; color: #8C857D; margin-top: 16px; text-align: center;">
        Jera Consulting (Pty) Ltd · 256 Rondebult Rd, Parkdene, Boksburg, 1459
      </p>
    </div>
  `
}

export function expenseNotificationHtml(action: 'submitted' | 'approved' | 'declined', claimantName: string, amount: string, notes?: string) {
  const titles = { submitted: 'Expense Claim Submitted', approved: 'Expense Claim Approved', declined: 'Expense Claim Declined' }
  const colours = { submitted: '#C4880C', approved: '#2D8A56', declined: '#DB4437' }
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <div style="background: ${colours[action]}; border-radius: 12px 12px 0 0; padding: 24px 28px;">
        <h1 style="color: #fff; font-size: 20px; margin: 0;">${titles[action]}</h1>
      </div>
      <div style="background: #fff; border: 1px solid #E8E4DF; border-top: none; border-radius: 0 0 12px 12px; padding: 28px;">
        <p style="font-size: 15px; color: #1a1a1a;">
          ${action === 'submitted' ? `${claimantName} has submitted an expense claim for <strong>${amount}</strong> requiring your approval.` : `Your expense claim for <strong>${amount}</strong> has been <strong>${action}</strong>.`}
        </p>
        ${notes ? `<p style="font-size: 13px; color: #6B645C; background: #FAF9F7; padding: 12px; border-radius: 8px; margin-top: 12px;"><strong>Notes:</strong> ${notes}</p>` : ''}
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/expenses" style="display: inline-block; background: #911431; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px;">
          View in PULSE →
        </a>
      </div>
    </div>
  `
}
