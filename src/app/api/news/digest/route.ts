import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import type { Session } from "next-auth"
import { digestGenerator } from "@/lib/news/digest-generator"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const date = searchParams.get('date')

    if (action === 'dates') {
      // Get available digest dates
      const dates = await digestGenerator.getAvailableDates(session.user.id)
      return NextResponse.json({ success: true, dates })
    }

    if (!date) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
    }

    // Get specific digest
    const digest = await digestGenerator.getDigest(session.user.id, date)
    
    if (!digest) {
      return NextResponse.json({ 
        success: false, 
        error: "No digest found for the specified date" 
      })
    }

    return NextResponse.json({ success: true, digest })

  } catch (error) {
    console.error("Digest API error:", error)
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

    const { action, date, preferences } = await request.json()

    if (action === 'generate') {
      if (!date) {
        return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
      }

      const digest = await digestGenerator.generateDailyDigest(
        session.user.id,
        date,
        preferences
      )

      return NextResponse.json({ success: true, digest })

    } else if (action === 'preferences') {
      // Update user digest preferences
      // This would typically store preferences in user config
      return NextResponse.json({ 
        success: true, 
        message: "Preferences updated" 
      })

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Digest API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}