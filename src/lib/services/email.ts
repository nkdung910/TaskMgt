/**
 * Email Service using Resend
 * 
 * Setup:
 * 1. Sign up at https://resend.com (Free tier: 100 emails/day)
 * 2. Get API key
 * 3. Add to .env: RESEND_API_KEY=re_...
 * 4. Verify domain (optional, for production)
 * 
 * For development: Can use onboarding@resend.dev as sender
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email using Resend API
 */
async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    // In development, log the email instead of failing
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Email would be sent:')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('Content:', text || html)
      return true
    }
    throw new Error('Email service not configured')
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      throw new Error(`Email send failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('Email sent successfully:', data.id)
    return true

  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  const subject = 'Reset Your Password'
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔐 Password Reset Request</h1>
    <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">
      Secure your account in just a few clicks
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      We received a request to reset your password for your Task Management account.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 25px; color: #374151; line-height: 1.6;">
      Click the button below to reset your password:
    </p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${resetUrl}" 
         style="background-color: #2563eb;
                background-image: linear-gradient(to bottom, #3b82f6, #2563eb);
                color: #ffffff; 
                padding: 16px 40px; 
                text-decoration: none; 
                border-radius: 10px; 
                font-weight: 700; 
                font-size: 18px;
                display: inline-block;
                box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
                border: 2px solid #2563eb;
                letter-spacing: 0.5px;
                transition: all 0.3s ease;">
        🔐 Reset Password
      </a>
    </div>
    
    <p style="text-align: center; font-size: 13px; color: #9ca3af; margin-top: -15px; margin-bottom: 25px;">
      Click the button above to create a new password
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 14px; color: #3b82f6; word-break: break-all; background: white; padding: 10px; border-radius: 5px; border: 1px solid #e5e7eb;">
      ${resetUrl}
    </p>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 5px solid #f59e0b; padding: 18px 20px; margin: 30px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);">
      <p style="margin: 0; font-size: 15px; color: #92400e; font-weight: 600; line-height: 1.5;">
        <span style="font-size: 20px;">⚠️</span> <strong>Important:</strong> This link will expire in <strong style="color: #b45309;">1 hour</strong>.
      </p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #a16207; line-height: 1.5;">
        For security reasons, please reset your password as soon as possible.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
      If you didn't request this password reset, you can safely ignore this email. 
      Your password will remain unchanged.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      This email was sent from Task Management App<br>
      If you have any questions, please contact support.
    </p>
  </div>
</body>
</html>
  `

  const text = `
Reset Your Password

Hello,

We received a request to reset your password for your Task Management account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

---
This email was sent from Task Management App
  `

  await sendEmail({
    to: email,
    subject,
    html,
    text
  })
}

