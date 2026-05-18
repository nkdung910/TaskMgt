import { NextRequest, NextResponse } from "next/server"
import { processAndStoreNews, generateDailyDigest, cleanupOldArticles } from "@/lib/news/aggregator"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import type { Session } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json()

    switch (action) {
      case 'aggregate':
        const result = await processAndStoreNews()
        return NextResponse.json({
          success: true,
          processed: result.processed,
          errors: result.errors
        })

      case 'generate_digest':
        const digestResult = await generateDailyDigest(session.user.id)
        if (digestResult.success) {
          return NextResponse.json({ success: true })
        } else {
          return NextResponse.json({ error: digestResult.error }, { status: 400 })
        }

      case 'cleanup':
        const cleanupResult = await cleanupOldArticles()
        return NextResponse.json({
          success: true,
          deleted: cleanupResult.deleted
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("News admin API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
