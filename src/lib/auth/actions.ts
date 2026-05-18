"use server"

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/database"
import { authOptions } from "@/lib/auth/config"
import type { AuthOptionsCompat } from "@/lib/auth/types"
import { createUserConfig } from "@/lib/config/actions"


export async function signUp(email: string, password: string) {
  try {
    // Validate password length
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long" }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return { error: "User already exists with this email" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
      }
    })

    // Create default user configuration
    const configResult = await createUserConfig(user.id)
    if (configResult.error) {
      console.error("Failed to create user config:", configResult.error)
      // Don't fail signup if config creation fails, just log it
    }

    return { success: true }
  } catch (_error) {
    console.error("SignUp error:", _error)
    return { error: "Failed to create account" }
  }
}

export async function logout() {
  // Server-side logout - just redirect
  redirect("/login")
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    // Get current session
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    
    if (!session?.user?.email) {
      return { error: "Not authenticated" }
    }

    // Validate new password
    if (newPassword.length < 6) {
      return { error: "New password must be at least 6 characters long" }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return { error: "Current password is incorrect" }
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return { error: "New password must be different from current password" }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password in database
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedNewPassword }
    })

    return { success: true }
  } catch (error) {
    console.error("Change password error:", error)
    return { error: "Failed to change password" }
  }
}

