import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import type { Session } from "next-auth"
import { rssParserService } from "@/lib/news/rss-parser"
import { rateLimiter } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'sources'

    switch (action) {
      case 'sources':
        const sources = rssParserService.getSources()
        return NextResponse.json({ sources })

      case 'status':
        const rateLimitStatus = rateLimiter.getAllLimits()
        return NextResponse.json({ 
          rateLimits: rateLimitStatus,
          sources: rssParserService.getSources().map(s => ({
            id: s.id,
            name: s.name,
            enabled: s.enabled,
            lastFetched: s.lastFetched
          }))
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("RSS API error:", error)
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

    const { action, sourceId, enabled } = await request.json()

    switch (action) {
      case 'toggle_source':
        if (!sourceId || typeof enabled !== 'boolean') {
          return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
        }

        rssParserService.setSourceEnabled(sourceId, enabled)
        return NextResponse.json({ 
          success: true, 
          message: `Source ${sourceId} ${enabled ? 'enabled' : 'disabled'}` 
        })

      case 'test_feed':
        if (!sourceId) {
          return NextResponse.json({ error: "Source ID required" }, { status: 400 })
        }

        try {
          const items = await rssParserService.parseFeedById(sourceId)
          return NextResponse.json({
            success: true,
            items: items.slice(0, 5), // Return first 5 items for testing
            count: items.length
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 400 })
        }

      case 'parse_all':
        try {
          const items = await rssParserService.parseAllFeeds()
          return NextResponse.json({
            success: true,
            items: items.slice(0, 20), // Return first 20 items
            count: items.length
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 400 })
        }

      case 'clear_rate_limits':
        rateLimiter.resetAllLimits()
        return NextResponse.json({ 
          success: true, 
          message: "Rate limits cleared" 
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("RSS API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
