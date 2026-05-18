import { NextResponse } from "next/server"
import { processAndStoreNews } from "@/lib/news/aggregator"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import type { Session } from "next-auth"

export async function POST() {
  try {
    const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔄 Manual news fetch triggered by user:', session.user.email)
    
    const result = await processAndStoreNews()
    
    return NextResponse.json({
      success: true,
      message: `News fetch completed. Processed: ${result.processed}, Errors: ${result.errors}`,
      processed: result.processed,
      errors: result.errors
    })
  } catch (error) {
    console.error("Manual news fetch error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch news",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
