import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import type { Session } from "next-auth"
import { prisma } from "@/lib/database"

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        rolePreferences: true,
        minRelevance: true
      }
    })

    return NextResponse.json({
      success: true,
      preferences: {
        roles: user?.rolePreferences || ['developer'],
        minRelevance: user?.minRelevance || 50
      }
    })
  } catch (error) {
    console.error("Get preferences error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roles, minRelevance } = await request.json()

    // Validate roles
    const validRoles = ['developer', 'qc', 'ba']
    const filteredRoles = (roles as string[]).filter((r: string) => validRoles.includes(r))
    
    if (filteredRoles.length === 0) {
      return NextResponse.json(
        { error: "At least one valid role must be selected" },
        { status: 400 }
      )
    }

    // Validate minRelevance (0-100)
    const validMinRelevance = Math.max(0, Math.min(100, minRelevance || 50))

    // Update user preferences
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        rolePreferences: filteredRoles,
        minRelevance: validMinRelevance
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save preferences error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

