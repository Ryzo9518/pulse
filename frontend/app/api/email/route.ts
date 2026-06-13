import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, pingEmailHtml, expenseNotificationHtml } from '@/lib/resend'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to_email, to_name, subject, html_body, from_name, from_employee_id, claim_amount, notes } = body

    let htmlContent: string

    switch (type) {
      case 'ping':
        htmlContent = pingEmailHtml(from_name || 'PULSE', to_name || 'Team Member')
        break
      case 'expense_submitted':
        htmlContent = expenseNotificationHtml('submitted', from_name, claim_amount, notes)
        break
      case 'expense_approved':
        htmlContent = expenseNotificationHtml('approved', from_name, claim_amount, notes)
        break
      case 'expense_declined':
        htmlContent = expenseNotificationHtml('declined', from_name, claim_amount, notes)
        break
      case 'notification':
        htmlContent = html_body || `<p>${body.message || 'You have a new notification from PULSE.'}</p>`
        break
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    const result = await sendEmail({
      to: to_email,
      subject: subject || 'PULSE Notification',
      html: htmlContent,
      from: from_name ? `${from_name} via PULSE <noreply@jera.co.za>` : undefined,
    })

    // Log the email in the database
    const supabase = createServerSupabase()
    await supabase.from('email_log').insert({
      from_employee: from_employee_id || null,
      to_email,
      subject: subject || 'PULSE Notification',
      body: htmlContent,
      email_type: type,
      resend_id: result?.id || null,
    })

    return NextResponse.json({ success: true, id: result?.id })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
