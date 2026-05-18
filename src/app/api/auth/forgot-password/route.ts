import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import crypto from "crypto"
import { checkRateLimit } from "@/lib/utils/rate-limit-forgot-password"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check rate limit (max 3 requests per 15 minutes per email)
    const rateLimit = checkRateLimit(email, 3, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: `Too many requests. Please try again in ${Math.ceil((rateLimit.retryAfter || 0) / 60)} minutes.` 
        },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`)
      return NextResponse.json({ 
        success: true,
        message: "If an account exists with this email, you will receive a password reset link."
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Send reset email
    try {
      const { sendPasswordResetEmail } = await import("@/lib/services/email")
      await sendPasswordResetEmail(email, resetToken)
      console.log(`Password reset email sent to: ${email}`)
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError)
      // Even if email fails, return success to not reveal user existence
      // But log the error for admin to investigate
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link."
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    )
  }
}

